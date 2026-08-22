import { NextResponse, type NextRequest } from 'next/server'
import { purgeOrder, trashOrder, updateOrder } from '@/lib/services/orderService'

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
      items: Array.isArray(body.items)
        ? body.items.map((it: { product: string; quantity: number; price?: number; originalPrice?: number; warehouse?: string }) => ({
            product: it.product,
            quantity: it.quantity,
            price: it.price,
            originalPrice: it.originalPrice,
            warehouse: it.warehouse,
          }))
        : undefined,
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

/**
 * Mặc định: xóa mềm (hoàn kho + chuyển vào thùng rác).
 * `?permanent=1`: xóa vĩnh viễn — chỉ hợp lệ với đơn đã nằm trong thùng rác.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const permanent = request.nextUrl.searchParams.get('permanent') === '1'

    const order = permanent ? await purgeOrder(id) : await trashOrder(id)
    if (!order) {
      return NextResponse.json(
        { error: permanent ? 'Đơn hàng không nằm trong thùng rác' : 'Order not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
