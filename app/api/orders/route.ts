import { NextResponse } from 'next/server'
import { createOrder, getAllOrders } from '@/lib/services/orderService'
import { WAREHOUSES } from '@/lib/types'

export async function GET() {
  try {
    const orders = await getAllOrders()
    return NextResponse.json(orders)
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

    const invalidItem = body.items.find(
      (it: { warehouse?: string }) => !it.warehouse || !(it.warehouse in WAREHOUSES),
    )
    if (invalidItem) {
      return NextResponse.json(
        { error: 'Vui lòng chọn kho xuất hàng cho mỗi sản phẩm' },
        { status: 400 },
      )
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
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
