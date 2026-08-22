import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Order, { type IOrder, type IOrderItem } from '@/models/Order'
import Product, { type IProduct } from '@/models/Product'
import { statusOrders, Warehouse, type StockAdjustment, type StockShortage } from '../types'
import { upsertCustomer } from '@/lib/services/customerService'

const warehouseField: Record<Warehouse, 'stockHN' | 'stockQB' | 'stockSG'> = {
  HN: 'stockHN',
  QB: 'stockQB',
  SG: 'stockSG',
}

/** Một đơn có nhiều dòng sản phẩm, và cùng một sản phẩm có thể nằm ở nhiều kho
 *  khác nhau (hoặc bị tách thành nhiều dòng cùng kho). Gộp lại theo cặp
 *  (sản phẩm, kho) để cộng/trừ kho đúng một lần với đúng tổng số lượng. */
interface ItemGroup {
  productId: string
  warehouse: Warehouse
  name: string
  quantity: number
}

function groupItemsByProductWarehouse(
  items: IOrderItem[],
  defaultWarehouse: Warehouse,
): ItemGroup[] {
  const groups = new Map<string, ItemGroup>()
  for (const item of items) {
    const warehouse = (item.warehouse as Warehouse) ?? defaultWarehouse
    const productId = String(item.product)
    const key = `${productId}:${warehouse}`
    const existing = groups.get(key)
    if (existing) existing.quantity += item.quantity
    else groups.set(key, { productId, warehouse, name: item.name, quantity: item.quantity })
  }
  return [...groups.values()]
}

/** Nạp product một lần duy nhất cho mỗi id trong cùng transaction — cùng một
 *  sản phẩm ở hai kho phải dùng chung một document, nếu không lần save sau sẽ
 *  ghi đè thay đổi của lần trước. */
function makeProductLoader(session: mongoose.ClientSession) {
  const cache = new Map<string, IProduct | null>()
  return async (productId: string): Promise<IProduct | null> => {
    if (cache.has(productId)) return cache.get(productId) ?? null
    const product = await Product.findById(productId).session(session)
    cache.set(productId, product)
    return product
  }
}

/** Lỗi khôi phục do kho không đủ hàng — kèm chi tiết từng sản phẩm để UI dựng dialog. */
export class InsufficientStockError extends Error {
  shortages: StockShortage[]
  constructor(shortages: StockShortage[]) {
    super('INSUFFICIENT_STOCK')
    this.name = 'InsufficientStockError'
    this.shortages = shortages
  }
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
  deleted?: boolean // true = chỉ lấy đơn trong thùng rác
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
  deleted = false,
}: OrderQuery = {}): Promise<OrdersResult> {
  await dbConnect()

  // Đơn trong thùng rác tách hẳn khỏi danh sách thường
  const trashFilter = deleted ? { $ne: null } : null
  const filter: Record<string, unknown> = { deletedAt: trashFilter }

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

  // Thùng rác sắp xếp theo thời điểm xóa (mới xóa lên đầu)
  const sort: Record<string, 1 | -1> = deleted
    ? { deletedAt: -1, _id: -1 }
    : { createdAt: -1, _id: -1 }

  const [orders, total, statsResult] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; count: number; revenue: number }>([
      { $match: { deletedAt: trashFilter } },
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

  // Đơn trong thùng rác không được sửa (kho của nó đã được hoàn lại)
  if (!items) {
    if (Object.keys(update).length === 0) return Order.findOne({ _id: id, deletedAt: null })
    return Order.findOneAndUpdate({ _id: id, deletedAt: null }, update, {
      new: true,
      runValidators: true,
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const existing = await Order.findById(id).session(session)
    if (!existing || existing.deletedAt) { await session.abortTransaction(); return null }

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

/**
 * Xóa mềm: hoàn kho ngay và chuyển đơn vào thùng rác.
 * MongoDB TTL sẽ tự xóa vĩnh viễn sau TRASH_RETENTION_DAYS ngày mà không cần
 * chạy thêm logic nào — vì kho đã được hoàn ở đây rồi.
 */
export async function trashOrder(id: string) {
  await dbConnect()
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const order = await Order.findById(id).session(session)
    if (!order) {
      await session.abortTransaction()
      return null
    }

    // Đã ở trong thùng rác → không hoàn kho lần hai (chống double-click / retry)
    if (order.deletedAt) {
      await session.abortTransaction()
      return order
    }

    const loadProduct = makeProductLoader(session)
    const groups = groupItemsByProductWarehouse(
      order.items,
      (order.warehouse as Warehouse) ?? 'HN',
    )

    const touched: IProduct[] = []
    for (const group of groups) {
      const product = await loadProduct(group.productId)
      // Sản phẩm đã bị xóa khỏi hệ thống thì bỏ qua, không chặn việc xóa đơn
      if (!product) continue

      const field = warehouseField[group.warehouse]
      ;(product[field] as number) = ((product[field] ?? 0) as number) + group.quantity
      if (!touched.includes(product)) touched.push(product)
    }
    for (const product of touched) await product.save({ session })

    order.deletedAt = new Date()
    await order.save({ session })
    await session.commitTransaction()
    return order
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Khôi phục đơn từ thùng rác: trừ lại kho đúng như lúc tạo đơn.
 *
 * Không đủ hàng → ném InsufficientStockError kèm chi tiết từng sản phẩm.
 * Với `force: true`, phần thiếu được nhập bù (kho bị kẹp sàn ở 0) và số lượng
 * bù được tính lại ngay trong transaction, không lấy theo số client gửi lên —
 * tồn kho có thể đã đổi từ lúc dialog hiện ra.
 */
export async function restoreOrder(
  id: string,
  { force = false }: { force?: boolean } = {},
): Promise<{ order: IOrder; adjustments: StockAdjustment[] } | null> {
  await dbConnect()
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const order = await Order.findById(id).session(session)
    if (!order) {
      await session.abortTransaction()
      return null
    }

    // Đơn đang hoạt động → không trừ kho lần hai
    if (!order.deletedAt) {
      await session.abortTransaction()
      return { order, adjustments: [] }
    }

    const loadProduct = makeProductLoader(session)
    const groups = groupItemsByProductWarehouse(
      order.items,
      (order.warehouse as Warehouse) ?? 'HN',
    )

    // Lượt 1: kiểm tra toàn bộ trước khi động vào kho — all-or-nothing
    const shortages: StockShortage[] = []
    const adjustments: StockAdjustment[] = []
    const plan: { product: IProduct; field: 'stockHN' | 'stockQB' | 'stockSG'; quantity: number }[] = []

    for (const group of groups) {
      const product = await loadProduct(group.productId)
      if (!product) {
        throw new Error(
          `Sản phẩm "${group.name}" không còn tồn tại, không thể khôi phục đơn hàng`,
        )
      }

      const field = warehouseField[group.warehouse]
      const available = (product[field] ?? 0) as number

      if (available < group.quantity) {
        const missing = group.quantity - available
        if (force) {
          adjustments.push({
            productId: group.productId,
            name: product.name,
            warehouse: group.warehouse,
            added: missing,
          })
        } else {
          shortages.push({
            productId: group.productId,
            name: product.name,
            warehouse: group.warehouse,
            required: group.quantity,
            available,
            missing,
          })
        }
      }

      plan.push({ product, field, quantity: group.quantity })
    }

    if (shortages.length > 0) {
      await session.abortTransaction()
      throw new InsufficientStockError(shortages)
    }

    // Lượt 2: trừ kho. Math.max(0, …) tương đương "nhập bù phần thiếu rồi trừ",
    // và đảm bảo tồn kho không bao giờ âm.
    const touched: IProduct[] = []
    for (const { product, field, quantity } of plan) {
      const available = (product[field] ?? 0) as number
      ;(product[field] as number) = Math.max(0, available - quantity)
      if (!touched.includes(product)) touched.push(product)
    }
    for (const product of touched) await product.save({ session })

    order.deletedAt = null
    order.restoredAt = new Date()
    await order.save({ session })
    await session.commitTransaction()
    return { order, adjustments }
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Xóa vĩnh viễn ngay lập tức. Chỉ áp dụng cho đơn đã ở trong thùng rác —
 * kho đã được hoàn lúc xóa mềm nên ở đây không đụng gì tới tồn kho.
 */
export async function purgeOrder(id: string) {
  await dbConnect()
  return Order.findOneAndDelete({ _id: id, deletedAt: { $ne: null } })
}
