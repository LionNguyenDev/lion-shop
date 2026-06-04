'use client'

import { MapPin, Phone, Plus, Trash2, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { formatProfit, formatVND } from '@/lib/format'
import { Order, Product, statusOrders } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrderEditModalProps {
  order: Order | null
  onClose: () => void
  onSaved: (updated: Order) => void
}

interface EditableItem {
  product: string
  quantity: number
  sellingPrice: number
}

const STATUS_OPTIONS = [statusOrders.UNPAID, statusOrders.PAID] as const

const statusActiveClass: Record<string, string> = {
  [statusOrders.UNPAID]: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  [statusOrders.PAID]:   'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
}

/* ─────────────────────────────────────────────────────────────
   Inner form — rendered with key={order._id} so React
   remounts (and resets all useState) whenever the order changes.
───────────────────────────────────────────────────────────── */
function EditForm({
  order,
  onClose,
  onSaved,
}: {
  order: Order
  onClose: () => void
  onSaved: (updated: Order) => void
}) {
  const [form, setForm] = useState({
    name:    order.name ?? '',
    phone:   order.phone ?? '',
    address: order.address ?? '',
    status:  order.status,
  })
  const [items, setItems] = useState<EditableItem[]>(() =>
    order.items.map((it) => ({
      product:      String(it.product),
      quantity:     it.quantity,
      sellingPrice: it.price,
    })),
  )
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    let ignore = false
    fetch('/api/products?limit=500')
      .then((r) => r.json())
      .then((d) => { if (!ignore) setProducts(d.products ?? d) })
      .catch(() => { if (!ignore) setError('Không thể tải sản phẩm') })
    return () => { ignore = true }
  }, [])

  /* ── Item helpers ── */
  const addItem = () =>
    setItems((prev) => [...prev, { product: '', quantity: 1, sellingPrice: 0 }])

  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: 'quantity' | 'sellingPrice', value: number) =>
    setItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })

  const handleProductChange = (i: number, productId: string) => {
    const p = products.find((x) => x._id === productId)
    setItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], product: productId, sellingPrice: p ? p.sellingPrice : next[i].sellingPrice }
      return next
    })
  }

  /* ── Totals ── */
  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0),
    [items],
  )

  const profit = useMemo(() => {
    const snapshot = new Map(order.items.map((it) => [String(it.product), it.originalPrice]))
    return items.reduce((sum, it) => {
      const prod     = products.find((p) => p._id === it.product)
      const original = prod?.originalPrice ?? snapshot.get(it.product) ?? 0
      return sum + (it.sellingPrice - original) * it.quantity
    }, 0)
  }, [items, products, order.items])

  /* ── Submit ── */
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (items.length === 0)               { setError('Vui lòng thêm ít nhất một sản phẩm'); return }
    if (items.some((it) => !it.product))  { setError('Vui lòng chọn sản phẩm cho mỗi dòng'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map(({ product, quantity, sellingPrice }) => ({
            product, quantity, price: sellingPrice,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cập nhật đơn hàng thất bại')
      onSaved(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Thông tin khách hàng */}
      <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Khách hàng <span className="font-normal normal-case text-muted-foreground/70">(tuỳ chọn)</span>
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="edit-name"><User className="w-3.5 h-3.5" /> Họ và tên</Label>
          <Input id="edit-name" placeholder="Họ và tên"
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-phone"><Phone className="w-3.5 h-3.5" /> Số điện thoại</Label>
          <Input id="edit-phone" type="tel" placeholder="Số điện thoại"
            value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-addr"><MapPin className="w-3.5 h-3.5" /> Địa chỉ</Label>
          <Textarea id="edit-addr" placeholder="Địa chỉ giao hàng"
            value={form.address} rows={2}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        </div>
      </div>

      {/* Trạng thái */}
      <div className="space-y-2">
        <Label>Trạng thái</Label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setForm((p) => ({ ...p, status: s }))}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                form.status === s ? statusActiveClass[s] : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sản phẩm */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sản phẩm</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus /> Thêm sản phẩm
          </Button>
        </div>

        {items.length === 0 && (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg text-sm">
            Chưa có sản phẩm.{' '}
            <button type="button" onClick={addItem} className="font-semibold underline underline-offset-2">
              Thêm sản phẩm
            </button>
          </div>
        )}

        {items.map((item, index) => {
          const prod         = products.find((p) => p._id === item.product)
          const fallbackName = order.items.find((oi) => String(oi.product) === item.product)?.name
          return (
            <div key={index} className="p-3 bg-muted/30 rounded-lg border space-y-2">
              {/* Hàng 1: chọn sản phẩm + nút xoá */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1 min-w-0">
                  <Label className="text-xs">Sản phẩm</Label>
                  <Select value={item.product} onValueChange={(val) => val && handleProductChange(index, val)}>
                    <SelectTrigger className="w-full">
                      {prod ? (
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border bg-muted">
                            {prod.image && <Image src={prod.image} alt={prod.name} fill sizes="20px" className="object-cover" />}
                          </span>
                          <span className="truncate text-sm">{prod.name}</span>
                        </span>
                      ) : (
                        <SelectValue placeholder={fallbackName ?? 'Chọn sản phẩm…'} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          <span className="flex items-center gap-2">
                            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded border bg-muted">
                              {p.image && <Image src={p.image} alt={p.name} fill sizes="24px" className="object-cover" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{p.name}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {p.stock} trong kho · {formatVND(p.sellingPrice)}
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}
                  className="hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 />
                </Button>
              </div>

              {/* Hàng 2: giá vốn + giá bán + số lượng */}
              <div className="flex items-end gap-2">
                {/* Giá vốn (chỉ đọc) */}
                {prod && (
                  <div className="flex-1 space-y-1 min-w-0">
                    <Label className="text-xs">Giá vốn</Label>
                    <div className="h-8 px-2.5 flex items-center rounded-lg border bg-muted text-sm text-muted-foreground line-through truncate">
                      {formatVND(prod.originalPrice)}
                    </div>
                  </div>
                )}

                {/* Giá bán */}
                <div className="w-28 space-y-1 shrink-0">
                  <Label className="text-xs">Giá bán (₫)</Label>
                  <Input type="number" required min="0" value={item.sellingPrice}
                    onChange={(e) => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)} />
                </div>

                {/* Số lượng */}
                <div className="w-16 space-y-1 shrink-0">
                  <Label className="text-xs">SL</Label>
                  <Input type="number" required min="1" value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
              </div>
            </div>
          )
        })}

        {/* Tổng cộng */}
        <div className="flex justify-between text-sm font-semibold px-1 pt-1">
          <span className="text-muted-foreground">Tổng cộng</span>
          <span className="text-emerald-600 dark:text-emerald-400">{formatVND(totalAmount)}</span>
        </div>
        <div className={cn(
          'flex items-center justify-between px-3 py-2 rounded-lg border',
          profit > 0 && 'bg-emerald-500/10 border-emerald-500/30',
          profit < 0 && 'bg-red-500/10 border-red-500/30',
          profit === 0 && 'bg-muted/40',
        )}>
          <span className="text-sm font-semibold">{profit >= 0 ? 'Lãi' : 'Lỗ'}</span>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            profit > 0 && 'text-emerald-600 dark:text-emerald-400',
            profit < 0 && 'text-red-600 dark:text-red-400',
          )}>
            {formatProfit(profit)}
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="sm:w-auto w-full">Hủy</Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  )
}

/* ─────────────────────────────────────────────────────────────
   Shell — only responsible for the Dialog wrapper
───────────────────────────────────────────────────────────── */
export default function OrderEditModal({ order, onClose, onSaved }: OrderEditModalProps) {
  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn hàng</DialogTitle>
          {order && (
            <p className="text-xs font-mono text-muted-foreground">
              #{order._id.slice(-10).toUpperCase()}
            </p>
          )}
        </DialogHeader>

        {order && (
          <EditForm key={order._id} order={order} onClose={onClose} onSaved={onSaved} />
        )}
      </DialogContent>
    </Dialog>
  )
}
