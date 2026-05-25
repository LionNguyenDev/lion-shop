import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  quantity: number
  price: number
}

export interface IOrder extends Document {
  items: IOrderItem[]
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
})

const OrderSchema: Schema = new Schema(
  {
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    name: { type: String, required: true }, // name of guest
    address: { type: String, required: true }, // address of guest
    phone: { type: String, required: true }, // phone number of guest
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
)

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)

export default Order
