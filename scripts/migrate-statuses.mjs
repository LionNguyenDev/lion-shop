// Migration: convert removed order statuses to "Paid".
// After shrinking statusOrders to { Unpaid, Paid }, existing orders with other
// statuses (Processing, Pending, Completed, Cancelled, Shipped, Delivered,
// Returned, Failed) need to be rewritten so they pass the new schema enum.
//
// Run with:  node scripts/migrate-statuses.mjs

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

const KEEP = ['Unpaid', 'Paid']

await mongoose.connect(MONGODB_URI)
const coll = mongoose.connection.collection('orders')

const toMigrate = await coll.countDocuments({ status: { $nin: KEEP } })
console.log(`Found ${toMigrate} order(s) with removed statuses → will set to "Paid"`)

if (toMigrate > 0) {
  const res = await coll.updateMany(
    { status: { $nin: KEEP } },
    { $set: { status: 'Paid' } },
  )
  console.log(`Updated ${res.modifiedCount} order(s).`)
}

await mongoose.disconnect()
