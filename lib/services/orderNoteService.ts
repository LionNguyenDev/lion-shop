import dbConnect from '@/lib/db'
import OrderNote from '@/models/OrderNote'

interface ProductInput {
  name: string
  quantity: number
}

function normalizeProducts(products: ProductInput[]): ProductInput[] {
  return products
    .map((p) => ({ name: (p.name ?? '').trim(), quantity: Math.max(1, Number(p.quantity) || 1) }))
    .filter((p) => p.name.length > 0)
}

export async function getAllOrderNotes() {
  await dbConnect()
  return OrderNote.find({}).sort({ createdAt: -1 })
}

export async function createOrderNote(data: {
  orderCode: string
  products: ProductInput[]
  note: string
}) {
  await dbConnect()
  return OrderNote.create({
    orderCode: data.orderCode.trim(),
    products:  normalizeProducts(data.products),
    note:      data.note.trim(),
  })
}

export async function updateOrderNote(
  id: string,
  data: { orderCode?: string; products?: ProductInput[]; note?: string },
) {
  await dbConnect()
  const update: Record<string, unknown> = {}
  if (data.orderCode !== undefined) update.orderCode = data.orderCode.trim()
  if (data.products  !== undefined) update.products  = normalizeProducts(data.products)
  if (data.note      !== undefined) update.note      = data.note.trim()

  if (Object.keys(update).length === 0) return OrderNote.findById(id)
  return OrderNote.findByIdAndUpdate(id, update, { new: true, runValidators: true })
}

export async function deleteOrderNote(id: string) {
  await dbConnect()
  return OrderNote.findByIdAndDelete(id)
}
