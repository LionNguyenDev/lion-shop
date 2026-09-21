// Đổi role của một user: admin | user | friend.
// Role "friend" (và admin) mới dùng được trang /tiktok.
//
// Chạy bằng:  npm run user:set-role -- <username> <role>
// Ví dụ:      npm run user:set-role -- thuylinh friend
//
// User phải đăng xuất rồi đăng nhập lại thì trang /tiktok mới mở được (role nằm trong cookie phiên).

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

// Phải khớp USER_ROLES trong models/User.ts
const USER_ROLES = ['admin', 'user', 'friend']

const [username, role] = process.argv.slice(2).map((s) => s?.trim().toLowerCase())
if (!username || !USER_ROLES.includes(role)) {
  console.error(`Cách dùng: npm run user:set-role -- <username> <${USER_ROLES.join('|')}>`)
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
const users = mongoose.connection.collection('users')

const user = await users.findOne({ username }, { projection: { name: 1, role: 1 } })
if (!user) {
  console.error(`Không tìm thấy user "${username}".`)
  await mongoose.disconnect()
  process.exit(1)
}

if (user.role === role) {
  console.log(`"${username}" (${user.name}) đã có role ${role}, không cần đổi.`)
} else {
  await users.updateOne({ _id: user._id }, { $set: { role } })
  console.log(`Đã đổi role của "${username}" (${user.name}): ${user.role} → ${role}`)
  console.log('User cần đăng xuất và đăng nhập lại để role mới có hiệu lực trên giao diện.')
}

await mongoose.disconnect()
