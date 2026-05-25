import dbConnect from '@/lib/db'
import Product, { type IProduct } from '@/models/Product'

export async function getAllProducts() {
  await dbConnect()
  return Product.find({}).sort({ createdAt: -1 })
}

export async function getProductById(id: string) {
  await dbConnect()
  return Product.findById(id)
}

export async function createProduct(data: Partial<IProduct>) {
  await dbConnect()
  const product = new Product(data)
  return product.save()
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
  await dbConnect()
  return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

export async function deleteProduct(id: string) {
  await dbConnect()
  return Product.findByIdAndDelete(id)
}
