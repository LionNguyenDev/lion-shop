import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getOrders, OrderValidationError } from '@/lib/services/orderService'
import { WAREHOUSES } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const from   = searchParams.get('from')   || undefined
    const to     = searchParams.get('to')     || undefined
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1',  10))
    const limit  = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const deleted = searchParams.get('deleted') === '1' // thùng rác

    const result = await getOrders({ search, status, from, to, page, limit, deleted })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 },
      )
    }

    const message = 'Vui lòng chọn kho xuất hàng cho mỗi sản phẩm'
    const warehouseIssues = (body.items as { warehouse?: string }[])
      .map((it, index) => (!it.warehouse || !(it.warehouse in WAREHOUSES) ? { index, message } : null))
      .filter(Boolean)
    if (warehouseIssues.length > 0) {
      return NextResponse.json({ error: message, issues: warehouseIssues }, { status: 400 })
    }

    const order = await createOrder({
      items: body.items,
      name: body.name?.trim() ?? '',
      phone: body.phone?.trim() ?? '',
      address: body.address?.trim() ?? '',
      status: body.status,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message, issues: error.issues }, { status: 400 })
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
