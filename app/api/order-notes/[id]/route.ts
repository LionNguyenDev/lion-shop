import { NextResponse } from 'next/server'
import { deleteOrderNote, updateOrderNote } from '@/lib/services/orderNoteService'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await updateOrderNote(id, {
      orderCode: body.orderCode,
      products:  body.products,
      note:      body.note,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Order note not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order note'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params

    const deleted = await deleteOrderNote(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Order note not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete order note'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
