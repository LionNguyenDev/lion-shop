import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import Order, { IOrder } from '@/models/Order'
import Product from '@/models/Product'

export async function getAllOrders() {
  await dbConnect()
  return Order.find({}).sort({ createdAt: -1 })
}

export async function createOrder(data: {
  items: { product: string; quantity: number }[]
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

      // Update stock
      product.stock -= item.quantity
      await product.save({ session })

      totalAmount += product.sellingPrice * item.quantity
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
      })
    }

    const order = new Order({
      items: orderItems,
      totalAmount,
      status: 'completed', // Auto-complete for this simple demo
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

export async function deleteOrder(id: string) {
  await dbConnect()
  return Order.findByIdAndDelete(id)
}
