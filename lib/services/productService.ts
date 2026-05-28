import dbConnect from '@/lib/db'
import Product, { type IProduct } from '@/models/Product'

export interface ProductQuery {
  search?: string
  brand?: string
  page?: number
  limit?: number
}

const totalStock = { $add: [
  { $ifNull: ['$stockHN', 0] },
  { $ifNull: ['$stockQB', 0] },
  { $ifNull: ['$stockSG', 0] },
] }

function addStock(p: IProduct & { _id: unknown; __v?: number }) {
  const hn = p.stockHN ?? 0
  const qb = p.stockQB ?? 0
  const sg = p.stockSG ?? 0
  return { ...p, stockHN: hn, stockQB: qb, stockSG: sg, stock: hn + qb + sg }
}

export async function getProducts({ search, brand, page = 1, limit = 10 }: ProductQuery = {}) {
  await dbConnect()

  const filter: Record<string, unknown> = {}
  if (search) filter.name  = { $regex: search, $options: 'i' }
  if (brand)  filter.brand = { $regex: brand,  $options: 'i' }

  const skip = (page - 1) * limit

  const [raw, total, statsResult, brands] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalCount:     { $sum: 1 },
          outOfStock:     { $sum: { $cond: [{ $eq: [totalStock, 0] },   1, 0] } },
          lowStock:       { $sum: { $cond: [{ $lt: [totalStock, 20] },  1, 0] } },
          inventoryValue: { $sum: { $multiply: [totalStock, '$sellingPrice'] } },
        },
      },
    ]),
    Product.distinct('brand'),
  ])

  const s = statsResult[0] ?? { totalCount: 0, outOfStock: 0, lowStock: 0, inventoryValue: 0 }

  return {
    products: raw.map(addStock),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    brands: (brands as string[]).filter(Boolean).sort(),
    stats: {
      total:          s.totalCount     as number,
      lowStock:       s.lowStock       as number,
      outOfStock:     s.outOfStock     as number,
      inventoryValue: s.inventoryValue as number,
    },
  }
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
