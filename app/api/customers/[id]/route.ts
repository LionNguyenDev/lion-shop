import { NextResponse } from 'next/server'
import { updateCustomer } from '@/lib/services/customerService'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body   = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Tên khách hàng là bắt buộc' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Số điện thoại là bắt buộc' }, { status: 400 })
    }

    const customer = await updateCustomer(id, {
      name:    body.name,
      phone:   body.phone,
      address: body.address ?? '',
    })

    if (!customer) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cập nhật thất bại'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
