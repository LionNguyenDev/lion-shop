import dbConnect from '@/lib/db'
import Customer from '@/models/Customer'

/**
 * Creates a new customer record or updates name/address if the phone already exists.
 * Safe to call after an order is committed — never throws on duplicate phone.
 */
export async function upsertCustomer(data: {
  name: string
  phone: string
  address: string
}) {
  await dbConnect()
  return Customer.findOneAndUpdate(
    { phone: data.phone.trim() },
    {
      $set: {
        name:    data.name.trim(),
        phone:   data.phone.trim(),
        address: data.address.trim(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  )
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
