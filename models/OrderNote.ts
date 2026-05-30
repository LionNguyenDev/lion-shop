import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IOrderNoteProduct {
  name: string
  quantity: number
}

export interface IOrderNote extends Document {
  orderCode: string
  products: IOrderNoteProduct[]
  note: string
  createdAt: Date
  updatedAt: Date
}

const OrderNoteProductSchema: Schema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
)

const OrderNoteSchema: Schema = new Schema(
  {
    orderCode: { type: String, required: true, trim: true },
    products:  { type: [OrderNoteProductSchema], required: true, validate: (v: unknown[]) => Array.isArray(v) && v.length > 0 },
    note:      { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

OrderNoteSchema.index({ createdAt: -1 })
OrderNoteSchema.index({ orderCode: 1 })

const OrderNote: Model<IOrderNote> =
  (mongoose.models.OrderNote as Model<IOrderNote>) ?? mongoose.model<IOrderNote>('OrderNote', OrderNoteSchema)

export default OrderNote
