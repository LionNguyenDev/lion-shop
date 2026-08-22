// Migration: bật thùng rác cho đơn hàng.
//
// 1. Gán deletedAt = null cho mọi đơn cũ (để index dùng deletedAt hoạt động đồng nhất).
// 2. Xóa 2 index cũ { createdAt: -1 } và { status: 1, createdAt: -1 } — chúng đã được
//    thay bằng { deletedAt, createdAt } và { deletedAt, status, createdAt }.
//    Mongoose chỉ tạo index mới chứ không bao giờ sửa/xóa index đã tồn tại.
// 3. Tạo TTL index xóa vĩnh viễn đơn trong thùng rác sau 10 ngày.
//
// Chạy bằng:  node scripts/migrate-trash.mjs

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
    // .env.local not present — fall back to whatever is in process.env
  }
}

loadEnvLocal()

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (looked in .env.local and process.env).')
  process.exit(1)
}

// Phải khớp TRASH_RETENTION_DAYS trong lib/types.ts
const TRASH_RETENTION_DAYS = 10
const TTL_INDEX_NAME = 'deletedAt_ttl'

await mongoose.connect(MONGODB_URI)
const coll = mongoose.connection.collection('orders')

// ── 1. Backfill deletedAt ──────────────────────────────────────────────
const missing = await coll.countDocuments({ deletedAt: { $exists: false } })
console.log(`Đơn hàng chưa có trường deletedAt: ${missing}`)
if (missing > 0) {
  const res = await coll.updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null } },
  )
  console.log(`  → đã gán deletedAt: null cho ${res.modifiedCount} đơn.`)
}

// ── 2. Xóa index cũ đã bị thay thế ─────────────────────────────────────
const existing = await coll.indexes()
const OBSOLETE = ['createdAt_-1', 'status_1_createdAt_-1']
for (const name of OBSOLETE) {
  if (existing.some((ix) => ix.name === name)) {
    await coll.dropIndex(name)
    console.log(`Đã xóa index cũ: ${name}`)
  } else {
    console.log(`Index cũ không tồn tại, bỏ qua: ${name}`)
  }
}

// ── 3. Index mới + TTL ─────────────────────────────────────────────────
await coll.createIndex({ deletedAt: 1, createdAt: -1 })
await coll.createIndex({ deletedAt: 1, status: 1, createdAt: -1 })
console.log('Đã tạo index truy vấn theo deletedAt.')

// TTL index không thể đổi expireAfterSeconds bằng createIndex → xóa rồi tạo lại
if (existing.some((ix) => ix.name === TTL_INDEX_NAME)) {
  await coll.dropIndex(TTL_INDEX_NAME)
  console.log('Đã xóa TTL index cũ để tạo lại.')
}
await coll.createIndex(
  { deletedAt: 1 },
  {
    name: TTL_INDEX_NAME,
    expireAfterSeconds: TRASH_RETENTION_DAYS * 24 * 60 * 60,
    partialFilterExpression: { deletedAt: { $type: 'date' } },
  },
)
console.log(`Đã tạo TTL index: đơn trong thùng rác tự xóa sau ${TRASH_RETENTION_DAYS} ngày.`)

console.log('\nIndex hiện tại của collection "orders":')
for (const ix of await coll.indexes()) {
  const ttl = ix.expireAfterSeconds !== undefined ? ` (TTL ${ix.expireAfterSeconds}s)` : ''
  console.log(`  - ${ix.name}: ${JSON.stringify(ix.key)}${ttl}`)
}

await mongoose.disconnect()
