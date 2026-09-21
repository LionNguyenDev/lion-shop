// Migration: đổi thời gian cache số liệu TikTok (collection "tiktokstats").
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

// Phải khớp TIKTOK_CACHE_TTL trong lib/types.ts
const TIKTOK_CACHE_TTL = 10 * 60
const TTL_INDEX_NAME = 'fetchedAt_1'

await mongoose.connect(MONGODB_URI)
const coll = mongoose.connection.collection('tiktokstats')

const existing = (await coll.indexes().catch(() => [])).find((ix) => ix.name === TTL_INDEX_NAME)
if (existing?.expireAfterSeconds === TIKTOK_CACHE_TTL) {
  console.log(`TTL index đã đúng ${TIKTOK_CACHE_TTL}s, không cần đổi.`)
} else {
  if (existing) {
    await coll.dropIndex(TTL_INDEX_NAME)
    console.log(`Đã xóa TTL index cũ (${existing.expireAfterSeconds}s).`)
  }
  await coll.createIndex({ fetchedAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: TIKTOK_CACHE_TTL })
  console.log(`Đã tạo TTL index: cache TikTok tự xóa sau ${TIKTOK_CACHE_TTL / 60} phút.`)
}

console.log('\nIndex hiện tại của collection "tiktokstats":')
for (const ix of await coll.indexes()) {
  const ttl = ix.expireAfterSeconds !== undefined ? ` (TTL ${ix.expireAfterSeconds}s)` : ''
  console.log(`  - ${ix.name}: ${JSON.stringify(ix.key)}${ttl}`)
}

await mongoose.disconnect()
