import mongoose, { type Document, type Model, Schema } from 'mongoose'
import { statusOrders, WAREHOUSES } from '@/lib/types'
export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
  originalPrice: number
}

export interface IOrder extends Document {
  items: IOrderItem[]
  totalAmount: number
  profit: number
  status: statusOrders
  warehouse: keyof typeof WAREHOUSES
  name: string
  phone: string
  address: string
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
})

const OrderSchema: Schema = new Schema(
  {
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true, default: 0 },
    name: { type: String, default: '' }, // tên khách (tuỳ chọn)
    address: { type: String, default: '' }, // địa chỉ khách (tuỳ chọn)
    phone: { type: String, default: '' }, // SĐT khách (tuỳ chọn)
    warehouse: {
      type: String,
      enum: Object.keys(WAREHOUSES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(statusOrders),
      default: statusOrders.UNPAID,
    },
  },
  { timestamps: true },
)

OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ?? mongoose.model<IOrder>('Order', OrderSchema)

export default Order
