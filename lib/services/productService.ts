import dbConnect from '@/lib/db'
import Product, { type IProduct } from '@/models/Product'
import type { Warehouse } from '@/lib/types'

export interface ProductQuery {
  search?: string
  brand?: string
  page?: number
  limit?: number
  outOfStock?: boolean
  warehouse?: Warehouse
}

const totalStock = { $add: [
  { $ifNull: ['$stockHN', 0] },
  { $ifNull: ['$stockQB', 0] },
  { $ifNull: ['$stockSG', 0] },
] }

const warehouseStockField: Record<Warehouse, string> = {
  HN: 'stockHN',
  QB: 'stockQB',
  SG: 'stockSG',
}

// Hết hàng = có ít nhất 1 trong 3 kho về 0 (không cần cả 3 kho cùng hết)
const anyWarehouseOutOfStock = {
  $or: [
    { $eq: [{ $ifNull: ['$stockHN', 0] }, 0] },
    { $eq: [{ $ifNull: ['$stockQB', 0] }, 0] },
    { $eq: [{ $ifNull: ['$stockSG', 0] }, 0] },
  ],
}

function addStock(p: IProduct & { _id: unknown; __v?: number }) {
  const hn = p.stockHN ?? 0
  const qb = p.stockQB ?? 0
  const sg = p.stockSG ?? 0
  return { ...p, stockHN: hn, stockQB: qb, stockSG: sg, stock: hn + qb + sg }
}

export async function getProducts({ search, brand, page = 1, limit = 10, outOfStock, warehouse }: ProductQuery = {}) {
  await dbConnect()

  const filter: Record<string, unknown> = {}
  // Một thanh tìm kiếm: khớp theo tên HOẶC nhãn hàng
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ]
  }
  if (brand)  filter.brand = { $regex: brand,  $options: 'i' }

  // Hết hàng riêng ở 1 kho cụ thể (bất kể tồn kho ở 2 kho còn lại)
  if (warehouse) {
    filter[warehouseStockField[warehouse]] = 0
  } else if (outOfStock) {
    // Hết hàng: chỉ cần 1 trong 3 kho về 0
    filter.$expr = anyWarehouseOutOfStock
  }

  const skip = (page - 1) * limit

  const [raw, total, statsResult, brands] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalCount:     { $sum: 1 },
          outOfStock:     { $sum: { $cond: [anyWarehouseOutOfStock, 1, 0] } },
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
