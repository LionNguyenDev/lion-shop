import { NextResponse } from 'next/server'
import { createOrderNote, getAllOrderNotes } from '@/lib/services/orderNoteService'

export async function GET() {
  try {
    const notes = await getAllOrderNotes()
    return NextResponse.json(notes)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch order notes' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.orderCode?.trim()) {
      return NextResponse.json({ error: 'Mã đơn là bắt buộc' }, { status: 400 })
    }
    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ error: 'Phải có ít nhất 1 sản phẩm' }, { status: 400 })
    }
    if (body.products.some((p: { name?: string }) => !p?.name?.trim())) {
      return NextResponse.json({ error: 'Tên sản phẩm là bắt buộc' }, { status: 400 })
    }
    if (!body.note?.trim()) {
      return NextResponse.json({ error: 'Nội dung note là bắt buộc' }, { status: 400 })
    }

    const note = await createOrderNote({
      orderCode: body.orderCode,
      products:  body.products,
      note:      body.note,
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order note'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
