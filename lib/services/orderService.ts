import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { statusOrders } from '../types'

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
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: unitPrice,
      })
    }

    const order = new Order({
      items: orderItems,
      totalAmount,
      name: data.name,
      address: data.address,
      phone: data.phone,
      status: data.status ?? statusOrders.UNPAID,
    })

    await order.save({ session })
    await session.commitTransaction()
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
  },
) {
  await dbConnect()
  return Order.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

export async function deleteOrder(id: string) {
  await dbConnect()
  return Order.findByIdAndDelete(id)
}
