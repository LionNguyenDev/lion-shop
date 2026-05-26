import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { statusOrders } from '../types'
import { upsertCustomer } from '@/lib/services/customerService'

export async function getAllOrders() {
  await dbConnect()
  return Order.find({}).sort({ createdAt: -1 })
}

export async function createOrder(data: {
  items: { product: string; quantity: number; price?: number }[]
  name: string
  address: string
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
      const product = await Product.findById(item.product).session(session)
      if (!product) {
        throw new Error(`Product with ID ${item.product} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`)
      }

      product.stock -= item.quantity
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
      })
    }

    const order = new Order({
      items: orderItems,
      totalAmount,
      profit,
      name: data.name,
      address: data.address,
      phone: data.phone,
      status: data.status ?? statusOrders.UNPAID,
    })

    await order.save({ session })
    await session.commitTransaction()

    // Save/update customer record — best-effort, never rolls back a committed order
    try {
      await upsertCustomer({ name: data.name, phone: data.phone, address: data.address })
    } catch {
      // Intentionally swallowed
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
    items?: { product: string; quantity: number; price?: number }[]
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
    if (!existing) {
      await session.abortTransaction()
      return null
    }

    // Restore stock from previous items so we can re-deduct cleanly.
    const oldQtyByProduct = new Map<string, number>()
    for (const it of existing.items) {
      const key = String(it.product)
      oldQtyByProduct.set(key, (oldQtyByProduct.get(key) ?? 0) + it.quantity)
    }
    const newQtyByProduct = new Map<string, number>()
    for (const it of items) {
      newQtyByProduct.set(it.product, (newQtyByProduct.get(it.product) ?? 0) + it.quantity)
    }

    const productIds = new Set<string>([
      ...oldQtyByProduct.keys(),
      ...newQtyByProduct.keys(),
    ])

    let totalAmount = 0
    let profit = 0
    const orderItems: {
      product: mongoose.Types.ObjectId
      name: string
      quantity: number
      price: number
      originalPrice: number
    }[] = []

    for (const productId of productIds) {
      const product = await Product.findById(productId).session(session)
      if (!product) throw new Error(`Product with ID ${productId} not found`)

      const delta = (newQtyByProduct.get(productId) ?? 0) - (oldQtyByProduct.get(productId) ?? 0)
      if (delta > 0 && product.stock < delta) {
        throw new Error(`Insufficient stock for product: ${product.name}`)
      }
      product.stock -= delta
      await product.save({ session })
    }

    // Build new items in the order the client supplied them.
    for (const it of items) {
      const product = await Product.findById(it.product).session(session)
      if (!product) throw new Error(`Product with ID ${it.product} not found`)
      const unitPrice = it.price ?? product.sellingPrice
      totalAmount += unitPrice * it.quantity
      profit += (unitPrice - product.originalPrice) * it.quantity
      orderItems.push({
        product: product._id as mongoose.Types.ObjectId,
        name: product.name,
        quantity: it.quantity,
        price: unitPrice,
        originalPrice: product.originalPrice,
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
