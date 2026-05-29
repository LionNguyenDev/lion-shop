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

// Always delete the cached model so schema changes take effect in dev without a server restart.
if (mongoose.models.Customer) {
  delete (mongoose.models as Record<string, unknown>)['Customer']
}
const Customer: Model<ICustomer> = mongoose.model<ICustomer>('Customer', CustomerSchema)

export default Customer
