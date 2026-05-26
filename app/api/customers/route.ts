import { NextResponse } from 'next/server'
import {
  getCustomerByPhone,
  searchCustomersByName,
} from '@/lib/services/customerService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const name  = searchParams.get('name')

  try {
    // Exact phone lookup
    if (phone) {
      const customer = await getCustomerByPhone(phone)
      return NextResponse.json(customer ?? null)
    }

    // Name search — partial/contains match
    if (name && name.trim().length > 0) {
      const customers = await searchCustomersByName(name.trim())
      return NextResponse.json(customers)
    }

    return NextResponse.json(
      { error: 'Provide ?phone= or ?name= query parameter' },
      { status: 400 },
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 },
    )
  }
}
