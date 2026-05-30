import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface ICustomer extends Document {
  name: string
  phone: string
  address?: string
  orderCount: number
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema: Schema = new Schema(
  {
    name:       { type: String, required: true, trim: true },
    phone:      { type: String, required: true, unique: true, trim: true },
    address:    { type: String, trim: true },
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ?? mongoose.model<ICustomer>('Customer', CustomerSchema)

export default Customer
