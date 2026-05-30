import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IProduct extends Document {
  name: string
  brand?: string
  type?: string
  originalPrice: number
  sellingPrice: number
  stockHN: number
  stockQB: number
  stockSG: number
  image: string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema = new Schema(
  {
    name:          { type: String, required: true, trim: true },
    brand:         { type: String, trim: true, default: '' },
    type:          { type: String, trim: true, default: '' },
    originalPrice: { type: Number, required: true, min: 0 },
    sellingPrice:  { type: Number, required: true, min: 0 },
    stockHN:       { type: Number, required: true, min: 0, default: 0 },
    stockQB:       { type: Number, required: true, min: 0, default: 0 },
    stockSG:       { type: Number, required: true, min: 0, default: 0 },
    image:         { type: String, required: true },
  },
  { timestamps: true },
)

const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ?? mongoose.model<IProduct>('Product', ProductSchema)

export default Product
