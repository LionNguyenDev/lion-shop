import { NextResponse } from 'next/server'
import {
  getAllCustomers,
  getCustomerByPhone,
  searchCustomersByName,
} from '@/lib/services/customerService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone  = searchParams.get('phone')
  const name   = searchParams.get('name')
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const size   = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const search = searchParams.get('search') ?? ''

  try {
    if (phone) {
      const customer = await getCustomerByPhone(phone)
      return NextResponse.json(customer ?? null)
    }

    if (name && name.trim().length > 0) {
      const customers = await searchCustomersByName(name.trim())
      return NextResponse.json(customers)
    }

    // List all — paginated, sorted by orderCount desc
    const result = await getAllCustomers(page, size, search)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 },
    )
  }
}
