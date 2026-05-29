import dbConnect from '@/lib/db'
import Customer from '@/models/Customer'

/**
 * Creates a new customer if the phone does not exist; increments orderCount either way.
 * Safe to call after an order is committed — never throws on duplicate phone.
 */
export async function upsertCustomer(data: {
  name: string
  phone: string
  address?: string
}) {
  await dbConnect()
  const insert: Record<string, string> = {
    name:  data.name.trim(),
    phone: data.phone.trim(),
  }
  if (data.address?.trim()) insert.address = data.address.trim()

  return Customer.findOneAndUpdate(
    { phone: data.phone.trim() },
    {
      $setOnInsert: insert,
      $inc: { orderCount: 1 },
    },
    { upsert: true, new: true, runValidators: true },
  )
}

/**
 * Updates name, phone, and/or address for an existing customer.
 */
export async function updateCustomer(
  id: string,
  data: { name?: string; phone?: string; address?: string },
) {
  await dbConnect()
  const update: Record<string, string> = {}
  if (data.name?.trim())    update.name    = data.name.trim()
  if (data.phone?.trim())   update.phone   = data.phone.trim()
  if (data.address !== undefined) update.address = data.address.trim()
  return Customer.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
}

/**
 * Exact phone lookup — returns null if not found.
 */
export async function getCustomerByPhone(phone: string) {
  await dbConnect()
  return Customer.findOne({ phone: phone.trim() })
}

/**
 * Case-insensitive contains search on name.
 * Returns at most `limit` results sorted alphabetically.
 */
export async function searchCustomersByName(query: string, limit = 8) {
  await dbConnect()
  return Customer.find({
    name: { $regex: query.trim(), $options: 'i' },
  })
    .limit(limit)
    .sort({ name: 1 })
}

/**
 * Paginated list of all customers, sorted by orderCount descending.
 * Optionally filters by name or phone via `search`.
 */
export async function getAllCustomers(page = 1, pageSize = 20, search = '') {
  await dbConnect()
  const filter = search.trim()
    ? {
        $or: [
          { name:  { $regex: search.trim(), $options: 'i' } },
          { phone: { $regex: search.trim() } },
        ],
      }
    : {}
  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ orderCount: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Customer.countDocuments(filter),
  ])
  return { customers, total, page, pageSize }
}
