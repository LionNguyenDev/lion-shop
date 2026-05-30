// Import sản phẩm từ scripts/products-import.json vào collection `products`.
//
// Tạo file JSON trước bằng:  python scripts/parse-products-xlsx.py
//
// Chạy:
//   node scripts/import-products.mjs            -> import (dừng nếu collection đã có dữ liệu)
//   node scripts/import-products.mjs --force    -> import thêm dù đã có dữ liệu
//   node scripts/import-products.mjs --reset    -> XOÁ hết products cũ rồi import lại
//   node scripts/import-products.mjs --dry-run  -> chỉ xem trước, không ghi DB

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // .env.local không tồn tại — dùng process.env hiện có
  }
}

loadEnvLocal()

const args = new Set(process.argv.slice(2))
const FORCE = args.has('--force')
const RESET = args.has('--reset')
const DRY = args.has('--dry-run')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI chưa được set (.env.local hoặc process.env).')
  process.exit(1)
}

const jsonPath = resolve(process.cwd(), 'scripts', 'products-import.json')
let records
try {
  records = JSON.parse(readFileSync(jsonPath, 'utf8'))
} catch {
  console.error(`Không đọc được ${jsonPath}. Chạy: python scripts/parse-products-xlsx.py trước.`)
  process.exit(1)
}

const now = new Date()
const docs = records.map((r) => ({
  name: r.name,
  brand: r.brand ?? '',
  type: r.type ?? '',
  originalPrice: Number(r.originalPrice) || 0,
  sellingPrice: Number(r.sellingPrice) || 0,
  stockHN: Number(r.stockHN) || 0,
  stockQB: Number(r.stockQB) || 0,
  stockSG: Number(r.stockSG) || 0,
  image: r.image || '/placeholder-product.svg',
  createdAt: now,
  updatedAt: now,
  __v: 0,
}))

console.log(`Đọc ${docs.length} sản phẩm từ products-import.json`)

if (DRY) {
  console.log('--dry-run: 2 bản ghi mẫu sẽ ghi:')
  console.log(JSON.stringify(docs.slice(0, 2), null, 2))
  process.exit(0)
}

await mongoose.connect(MONGODB_URI)
const coll = mongoose.connection.collection('products')

const existing = await coll.countDocuments()
console.log(`Collection products hiện có: ${existing} sản phẩm`)

if (RESET) {
  const del = await coll.deleteMany({})
  console.log(`--reset: đã xoá ${del.deletedCount} sản phẩm cũ.`)
} else if (existing > 0 && !FORCE) {
  console.error(
    'Collection đã có dữ liệu. Dùng --force để import thêm, hoặc --reset để xoá rồi import lại. Đã huỷ.',
  )
  await mongoose.disconnect()
  process.exit(1)
}

const res = await coll.insertMany(docs, { ordered: false })
console.log(`✓ Đã import ${res.insertedCount} sản phẩm.`)

const total = await coll.countDocuments()
console.log(`Tổng số sản phẩm trong DB hiện tại: ${total}`)

await mongoose.disconnect()
