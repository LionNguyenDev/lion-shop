// Migration: đổi thời gian lưu dữ liệu TikTok:
//   - "tiktokstats":       cache số liệu từng video (TIKTOK_CACHE_TTL)
//   - "tiktokresultsets":  bảng kết quả của từng user (TIKTOK_RESULTS_TTL)
//
// TTL index không thể đổi expireAfterSeconds bằng createIndex, và Mongoose không bao giờ
// sửa index đã tồn tại → xóa TTL index cũ rồi tạo lại với thời gian mới.
//
// Chạy bằng:  node scripts/migrate-tiktok-cache.mjs

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

// Phải khớp TIKTOK_CACHE_TTL / TIKTOK_RESULTS_TTL trong lib/types.ts
const TARGETS = [
  { collection: 'tiktokstats',      field: 'fetchedAt', ttl: 10 * 60,      label: 'cache số liệu TikTok' },
  { collection: 'tiktokresultsets', field: 'savedAt',   ttl: 2 * 60 * 60,  label: 'bảng kết quả TikTok' },
]

await mongoose.connect(MONGODB_URI)

for (const { collection, field, ttl, label } of TARGETS) {
  const coll      = mongoose.connection.collection(collection)
  const indexName = `${field}_1`
  const existing  = (await coll.indexes().catch(() => [])).find((ix) => ix.name === indexName)

  if (existing?.expireAfterSeconds === ttl) {
    console.log(`[${collection}] TTL index đã đúng ${ttl}s, không cần đổi.`)
  } else {
    if (existing) {
      await coll.dropIndex(indexName)
      console.log(`[${collection}] Đã xóa TTL index cũ (${existing.expireAfterSeconds}s).`)
    }
    await coll.createIndex({ [field]: 1 }, { name: indexName, expireAfterSeconds: ttl })
    console.log(`[${collection}] Đã tạo TTL index: ${label} tự xóa sau ${ttl / 60} phút.`)
  }
}

await mongoose.disconnect()
