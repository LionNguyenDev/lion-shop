import mongoose, { type Document, type Model, Schema } from 'mongoose'
import { statusOrders } from '@/lib/types'
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
    name: { type: String, required: true }, // name of guest
    address: { type: String, required: true }, // address of guest
    phone: { type: String, required: true }, // phone number of guest
    status: {
      type: String,
      enum: Object.values(statusOrders),
      default: statusOrders.PENDING,
    },
  },
  { timestamps: true },
)

OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

// Always delete the cached model so schema changes (e.g. new enum values)
// take effect immediately in dev without requiring a server restart.
if (mongoose.models.Order) {
  delete (mongoose.models as Record<string, unknown>)['Order']
}
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema)

export default Order
