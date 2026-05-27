'use client'

import { Hash, Package, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { OrderNote } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface OrderNoteFormProps {
  note?: OrderNote | null
  onSuccess: (note: OrderNote) => void
  onCancel: () => void
}

interface ProductRow {
  name: string
  quantity: number
}

export default function OrderNoteForm({ note, onSuccess, onCancel }: OrderNoteFormProps) {
  const isEdit = !!note
  const [orderCode, setOrderCode] = useState(note?.orderCode ?? '')
  const [products, setProducts]   = useState<ProductRow[]>(
    note?.products?.length
      ? note.products.map((p) => ({ name: p.name, quantity: p.quantity }))
      : [{ name: '', quantity: 1 }],
  )
  const [content, setContent]     = useState(note?.note ?? '')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const addProduct = () =>
    setProducts((prev) => [...prev, { name: '', quantity: 1 }])

  const removeProduct = (idx: number) =>
    setProducts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))

  const updateProduct = (idx: number, field: keyof ProductRow, value: string | number) =>
    setProducts((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const cleaned = products
      .map((p) => ({ name: p.name.trim(), quantity: Math.max(1, p.quantity || 1) }))
      .filter((p) => p.name.length > 0)

    if (cleaned.length === 0) {
      setError('Vui lòng nhập ít nhất 1 sản phẩm')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url    = isEdit ? `/api/order-notes/${note!._id}` : '/api/order-notes'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode, products: cleaned, note: content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại')
      onSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="note-order-code"><Hash className="w-3.5 h-3.5" /> Mã đơn</Label>
        <Input
          id="note-order-code"
          required
          placeholder="VD: A1B2C3D4E5"
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value)}
        />
      </div>

      {/* Products list */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label><Package className="w-3.5 h-3.5" /> Sản phẩm</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addProduct} className="h-7 px-2 text-xs">
            <Plus className="h-3 w-3" /> Thêm
          </Button>
        </div>
        <div className="space-y-2">
          {products.map((p, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <Input
                placeholder="Tên sản phẩm"
                value={p.name}
                onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                placeholder="SL"
                value={p.quantity}
                onChange={(e) => updateProduct(idx, 'quantity', parseInt(e.target.value) || 1)}
                className="w-20 shrink-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeProduct(idx)}
                disabled={products.length === 1}
                className="hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={products.length === 1 ? 'Cần ít nhất 1 sản phẩm' : 'Xóa'}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note-content"><StickyNote className="w-3.5 h-3.5" /> Note</Label>
        <Textarea
          id="note-content"
          required
          placeholder="Nội dung ghi chú…"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
      </div>
    </form>
  )
}
