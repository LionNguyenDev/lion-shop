'use client'

import { MapPin, Phone, Plus, Trash2, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatProfit, formatVND } from '@/lib/format'
import { Order, Product, statusOrders, WAREHOUSES, Warehouse } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductSearch, warehouseStockKey } from './ProductSearch'
import VndInput from './VndInput'
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

interface OrderEditModalProps {
  order: Order | null
  onClose: () => void
  onSaved: (updated: Order) => void
}

interface EditableItem {
  product: string
  quantity: number
  sellingPrice: number
  originalPrice: number
  warehouse: Warehouse
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
      product:       String(it.product),
      quantity:      it.quantity,
      sellingPrice:  it.price,
      originalPrice: it.originalPrice,
      warehouse:     (it.warehouse ?? order.warehouse ?? 'HN') as Warehouse,
    })),
  )
  /* Cache sản phẩm để hiển thị ảnh/tồn kho trong ô tìm kiếm */
  const [productCache, setProductCache] = useState<Record<string, Product>>({})
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  /* Tải dữ liệu các sản phẩm đã có trong đơn (theo id) để hiển thị */
  useEffect(() => {
    const ids = order.items.map((it) => String(it.product)).filter(Boolean)
    if (ids.length === 0) return
    let ignore = false
    Promise.all(
      ids.map((id) => fetch(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
    ).then((list) => {
      if (ignore) return
      const fetched = list.filter(Boolean) as Product[]
      if (fetched.length === 0) return
      setProductCache((prev) => {
        const next = { ...prev }
        for (const p of fetched) next[p._id] = p
        return next
      })
    })
    return () => { ignore = true }
  }, [order.items])

  /* ── Item helpers ── */
  const addItem = () =>
    setItems((prev) => [...prev, { product: '', quantity: 1, sellingPrice: 0, originalPrice: 0, warehouse: (order.warehouse ?? 'HN') as Warehouse }])

  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i))

  const updateItem = (i: number, field: 'quantity' | 'sellingPrice' | 'originalPrice', value: number) =>
    setItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })

  const handleProductSelect = (i: number, product: Product) => {
    setProductCache((prev) => ({ ...prev, [product._id]: product }))
    setItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], product: product._id, sellingPrice: product.sellingPrice, originalPrice: product.originalPrice }
      return next
    })
  }

  const updateItemWarehouse = (i: number, wh: Warehouse) =>
    setItems((prev) => { const next = [...prev]; next[i] = { ...next[i], warehouse: wh }; return next })

  const stockDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const updateProductStock = useCallback((productId: string, field: 'stockHN' | 'stockQB' | 'stockSG', value: number) => {
    setProductCache((prev) => {
      const p = prev[productId]
      if (!p) return prev
      return { ...prev, [productId]: { ...p, [field]: value } }
    })
    const key = `${productId}:${field}`
    clearTimeout(stockDebounceRef.current[key])
    stockDebounceRef.current[key] = setTimeout(() => {
      fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      }).catch(() => {})
    }, 600)
  }, [])

  /* ── Totals ── */
  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0),
    [items],
  )

  const profit = useMemo(
    () => items.reduce((sum, it) => sum + (it.sellingPrice - it.originalPrice) * it.quantity, 0),
    [items],
  )

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
          items: items.map(({ product, quantity, sellingPrice, originalPrice, warehouse }) => ({
            product, quantity, price: sellingPrice, originalPrice, warehouse,
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
          const fallbackName = order.items.find((oi) => String(oi.product) === item.product)?.name
          return (
            <div key={index} className="p-3 bg-muted/30 rounded-lg border space-y-2">
              {/* Hàng 1: chọn sản phẩm + nút xoá */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1 min-w-0">
                  <Label className="text-xs">Sản phẩm</Label>
                  <ProductSearch
                    selectedProduct={productCache[item.product]}
                    warehouse={item.warehouse}
                    fallbackName={fallbackName}
                    onSelect={(p) => handleProductSelect(index, p)}
                  />
                </div>

                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}
                  className="hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 />
                </Button>
              </div>

              {/* Hàng 2: chọn kho + inline stock */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] text-muted-foreground shrink-0">Kho:</p>
                {(Object.entries(WAREHOUSES) as [Warehouse, string][]).map(([key, label]) => {
                  const stockField = warehouseStockKey[key]
                  const selected = productCache[item.product]
                  const stock = selected ? (selected[stockField] ?? 0) : null
                  return (
                    <div key={key} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateItemWarehouse(index, key)}
                        className={cn(
                          'px-2 py-0.5 rounded border text-xs font-medium transition-colors',
                          item.warehouse === key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted',
                        )}
                      >
                        {label}
                      </button>
                      {stock !== null && (
                        <input
                          type="number" min="0" value={stock}
                          onChange={(e) => updateProductStock(selected!._id, stockField, parseInt(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className={cn(
                            'w-12 h-5 rounded border text-center text-xs tabular-nums bg-background focus:outline-none focus:ring-1 focus:ring-primary',
                            stock === 0 ? 'border-red-400 text-red-500 dark:border-red-600' : 'border-border text-foreground',
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Hàng 3: giá vốn + giá bán + số lượng */}
              <div className="flex items-end gap-2">
                {/* Giá vốn */}
                <div className="flex-1 space-y-1 min-w-0">
                  <Label className="text-xs">Giá vốn (nghìn ₫)</Label>
                  <VndInput required className="h-9 text-sm"
                    value={item.originalPrice}
                    onChange={(v) => updateItem(index, 'originalPrice', v)} />
                </div>

                {/* Giá bán */}
                <div className="w-28 space-y-1 shrink-0">
                  <Label className="text-xs">Giá bán (nghìn ₫)</Label>
                  <VndInput required className="h-9 text-sm"
                    value={item.sellingPrice}
                    onChange={(v) => updateItem(index, 'sellingPrice', v)} />
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
