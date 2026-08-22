import { NextResponse } from 'next/server'
import { InsufficientStockError, restoreOrder } from '@/lib/services/orderService'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * Khôi phục đơn hàng từ thùng rác (trừ lại kho).
 *
 * Body `{ force: true }` → nhập bù phần kho còn thiếu rồi khôi phục.
 * Không đủ hàng và không có force → 409 kèm `shortages` để UI dựng dialog xác nhận.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const force = body?.force === true

    const result = await restoreOrder(id, { force })
    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order: result.order, adjustments: result.adjustments })
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_STOCK', shortages: error.shortages },
        { status: 409 },
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to restore order'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
