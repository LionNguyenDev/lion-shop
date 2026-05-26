import { NextResponse } from 'next/server'
import { deleteOrder, updateOrder } from '@/lib/services/orderService'
import { statusOrders } from '@/lib/types'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await updateOrder(id, {
      name: body.name?.trim(),
      phone: body.phone?.trim(),
      address: body.address?.trim(),
      status: body.status,
      items: Array.isArray(body.items) ? body.items : undefined,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params

    const deleted = await deleteOrder(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
