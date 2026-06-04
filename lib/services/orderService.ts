import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { statusOrders, Warehouse } from '../types'
import { upsertCustomer } from '@/lib/services/customerService'

const warehouseField: Record<Warehouse, 'stockHN' | 'stockQB' | 'stockSG'> = {
  HN: 'stockHN',
  QB: 'stockQB',
  SG: 'stockSG',
}

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000 // Asia/Ho_Chi_Minh

/** UTC Date for VN midnight of the given YYYY-MM-DD (dayOffset shifts whole days). */
function vnDayBoundary(iso: string, dayOffset = 0): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const [, y, mo, d] = m
  return new Date(Date.UTC(+y, +mo - 1, +d + dayOffset) - TZ_OFFSET_MS)
}

export interface OrderQuery {
  search?: string
  status?: string
  from?: string   // YYYY-MM-DD (inclusive)
  to?: string     // YYYY-MM-DD (inclusive)
  page?: number
  limit?: number
}

export interface OrdersResult {
  orders: unknown[]
  total: number
  page: number
  totalPages: number
  stats: { total: number; unpaid: number; paid: number; revenue: number }
}

export async function getOrders({
  search,
  status,
  from,
  to,
  page = 1,
  limit = 10,
}: OrderQuery = {}): Promise<OrdersResult> {
  await dbConnect()

  const filter: Record<string, unknown> = {}

  if (search) {
    const rx = { $regex: search, $options: 'i' }
    filter.$or = [
      { name: rx },
      { phone: rx },
      { 'items.name': rx },
      // match by order code (hex of _id)
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: search, options: 'i' } } },
    ]
  }

  if (status) filter.status = status

  const start = from ? vnDayBoundary(from, 0) : null
  const end   = to   ? vnDayBoundary(to, 1)   : null // exclusive end = next day's midnight
  if (start || end) {
    filter.createdAt = {
      ...(start ? { $gte: start } : {}),
      ...(end   ? { $lt:  end }   : {}),
    }
  }

  const skip = (page - 1) * limit

  const [orders, total, statsResult] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; count: number; revenue: number }>([
      {
        $group: {
          _id: '$status',
          count:   { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]),
  ])

  let unpaid = 0
  let paid = 0
  let revenue = 0
  let allTotal = 0
  for (const row of statsResult) {
    allTotal += row.count
    if (row._id === statusOrders.PAID) {
      paid = row.count
      revenue = row.revenue
    } else if (row._id === statusOrders.UNPAID) {
      unpaid = row.count
    }
  }

  return {
    orders,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: { total: allTotal, unpaid, paid, revenue },
  }
}

export async function createOrder(data: {
  items: { product: string; quantity: number; price?: number; warehouse: Warehouse }[]
  name: string
  address?: string
  phone: string
  status?: statusOrders
}) {
  await dbConnect()
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    let totalAmount = 0
    let profit = 0
    const orderItems = []

    for (const item of data.items) {
      const field = warehouseField[item.warehouse]
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error(`Không tìm thấy sản phẩm: ${item.product}`)

      const warehouseStock = (product[field] ?? 0) as number
      if (warehouseStock < item.quantity) {
        throw new Error(`Kho ${item.warehouse} không đủ hàng cho sản phẩm: ${product.name} (còn ${warehouseStock})`)
      }

      product[field] = warehouseStock - item.quantity
      await product.save({ session })

      const unitPrice = item.price ?? product.sellingPrice
      totalAmount += unitPrice * item.quantity
      profit += (unitPrice - product.originalPrice) * item.quantity
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: unitPrice,
        originalPrice: product.originalPrice,
        warehouse: item.warehouse,
      })
    }

    const order = new Order({
      items: orderItems,
      totalAmount,
      profit,
      name: data.name,
      address: data.address ?? '',
      phone: data.phone,
      warehouse: data.items[0].warehouse,
      status: data.status ?? statusOrders.UNPAID,
    })

    await order.save({ session })
    await session.commitTransaction()

    // Chỉ lưu vào danh bạ khách khi có đủ tên & SĐT (customer là tuỳ chọn khi tạo đơn)
    if (data.name?.trim() && data.phone?.trim()) {
      try {
        await upsertCustomer({ name: data.name, phone: data.phone, address: data.address ?? '' })
      } catch {
        // best-effort
      }
    }

    return order
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

export async function updateOrder(
  id: string,
  data: {
    name?: string
    phone?: string
    address?: string
    status?: statusOrders
    items?: { product: string; quantity: number; price?: number; originalPrice?: number; warehouse?: Warehouse }[]
  },
) {
  await dbConnect()

  const { items, ...rest } = data
  const update: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) update[k] = v
  }

  if (!items) {
    if (Object.keys(update).length === 0) return Order.findById(id)
    return Order.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const existing = await Order.findById(id).session(session)
    if (!existing) { await session.abortTransaction(); return null }

    const defaultWarehouse = (existing.warehouse as Warehouse) ?? 'HN'

    // Delta per (productId:warehouse) key
    const oldQtyByKey = new Map<string, number>()
    for (const it of existing.items) {
      const wh = (it.warehouse as Warehouse) ?? defaultWarehouse
      const key = `${String(it.product)}:${wh}`
      oldQtyByKey.set(key, (oldQtyByKey.get(key) ?? 0) + it.quantity)
    }
    const newQtyByKey = new Map<string, number>()
    for (const it of items) {
      const wh = it.warehouse ?? defaultWarehouse
      const key = `${it.product}:${wh}`
      newQtyByKey.set(key, (newQtyByKey.get(key) ?? 0) + it.quantity)
    }

    const allKeys = new Set([...oldQtyByKey.keys(), ...newQtyByKey.keys()])

    let totalAmount = 0
    let profit = 0
    const orderItems: {
      product: mongoose.Types.ObjectId
      name: string
      quantity: number
      price: number
      originalPrice: number
      warehouse: Warehouse
    }[] = []

    for (const compositeKey of allKeys) {
      const colonIdx = compositeKey.lastIndexOf(':')
      const productId = compositeKey.slice(0, colonIdx)
      const wh = compositeKey.slice(colonIdx + 1) as Warehouse
      const field = warehouseField[wh]
      const product = await Product.findById(productId).session(session)
      if (!product) throw new Error(`Không tìm thấy sản phẩm: ${productId}`)

      const delta = (newQtyByKey.get(compositeKey) ?? 0) - (oldQtyByKey.get(compositeKey) ?? 0)
      const currentStock = (product[field] ?? 0) as number
      if (delta > 0 && currentStock < delta) {
        throw new Error(`Kho ${wh} không đủ hàng cho sản phẩm: ${product.name} (còn ${currentStock})`)
      }
      product[field] = currentStock - delta
      await product.save({ session })
    }

    for (const it of items) {
      const wh = it.warehouse ?? defaultWarehouse
      const product = await Product.findById(it.product).session(session)
      if (!product) throw new Error(`Không tìm thấy sản phẩm: ${it.product}`)
      const unitPrice = it.price ?? product.sellingPrice
      const originalPrice = it.originalPrice ?? product.originalPrice
      totalAmount += unitPrice * it.quantity
      profit += (unitPrice - originalPrice) * it.quantity
      orderItems.push({
        product: product._id as mongoose.Types.ObjectId,
        name: product.name,
        quantity: it.quantity,
        price: unitPrice,
        originalPrice,
        warehouse: wh,
      })
    }

    existing.set({ ...update, items: orderItems, totalAmount, profit })
    await existing.save({ session })
    await session.commitTransaction()
    return existing
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

export async function deleteOrder(id: string) {
  await dbConnect()
  return Order.findByIdAndDelete(id)
}
