'use client'

import { MapPin, Phone, Plus, ShoppingCart, Trash2, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatVND } from '@/lib/format'
import { Customer, Order, Product, statusOrders, WAREHOUSES, Warehouse } from '@/lib/types'
import VndInput from './VndInput'
import { ProductSearch, useDebouncedValue, warehouseStockKey } from './ProductSearch'
import { cn } from '@/lib/utils'
import { NUMERIC } from '@/lib/orderStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderFormProps {
  onSuccess?: (order: Order) => void
  onCancel?: () => void
  initialItems?: { product: string; quantity: number; sellingPrice: number; warehouse?: Warehouse }[]
}

/* ── Name autocomplete ── */
interface NameAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (customer: Customer) => void
}

function NameAutocomplete({ value, onChange, onSelect }: NameAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Customer[]>([])
  const [open, setOpen]               = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef                  = useRef<HTMLDivElement>(null)
  const debouncedName                 = useDebouncedValue(value, 300)

  useEffect(() => {
    if (debouncedName.trim().length < 1) return
    let cancelled = false
    fetch(`/api/customers?name=${encodeURIComponent(debouncedName)}`)
      .then((r) => r.json())
      .then((data: Customer[]) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setSuggestions(list)
        setOpen(list.length > 0)
        setActiveIndex(-1)
      })
      .catch(() => { if (!cancelled) { setSuggestions([]); setOpen(false) } })
    return () => { cancelled = true }
  }, [debouncedName])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0]
      if (pick) { e.preventDefault(); onSelect(pick); setOpen(false) }
    } else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="cust-name" placeholder="Họ và tên" autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.trim().length < 1) { setSuggestions([]); setOpen(false) }
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
      />
      {open && suggestions.length > 0 && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          {suggestions.map((c, i) => (
            <li
              key={c._id} role="option" aria-selected={i === activeIndex}
              onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false) }}
              className={cn(
                'flex flex-col px-3 py-2 cursor-pointer text-sm transition-colors select-none',
                i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
              )}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.phone} · {c.address}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Main form ── */
const TWO_COLUMN_THRESHOLD = 3

export default function OrderForm({ onSuccess, onCancel, initialItems }: OrderFormProps) {
  const [productCache, setProductCache] = useState<Record<string, Product>>({})
  const [selectedItems, setSelectedItems] = useState<
    { product: string; quantity: number | ''; sellingPrice: number; warehouse: Warehouse }[]
  >((initialItems ?? []).map((it) => ({ ...it, warehouse: it.warehouse ?? 'QB' })))
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '' })
  const [autoFilled, setAutoFilled]     = useState(false)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  /* Lỗi theo từng dòng sản phẩm (index → các thông báo) do server trả về */
  const [itemErrors, setItemErrors]     = useState<Record<number, string[]>>({})
  const twoColumns = selectedItems.length >= TWO_COLUMN_THRESHOLD

  /* Tải dữ liệu sản phẩm cho các dòng có sẵn (mở từ trang sản phẩm) */
  useEffect(() => {
    const ids = (initialItems ?? []).map((it) => it.product).filter(Boolean)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const debouncedPhone = useDebouncedValue(customerInfo.phone, 400)
  useEffect(() => {
    const phone = debouncedPhone.trim()
    if (phone.length < 8) return
    let cancelled = false
    fetch(`/api/customers?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data: Customer | null) => {
        if (cancelled || !data) return
        setCustomerInfo({ name: data.name, phone: data.phone, address: data.address ?? '' })
        setAutoFilled(true)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [debouncedPhone])

  const addItem    = () => setSelectedItems((prev) => [...prev, { product: '', quantity: 1, sellingPrice: 0, warehouse: 'QB' }])
  const clearItemError = (i: number) =>
    setItemErrors((prev) => { if (!(i in prev)) return prev; const next = { ...prev }; delete next[i]; return next })
  const removeItem = (i: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== i))
    // Dời chỉ số lỗi của các dòng phía sau lên một bậc
    setItemErrors((prev) => {
      const next: Record<number, string[]> = {}
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k)
        if (idx < i) next[idx] = v
        else if (idx > i) next[idx - 1] = v
      }
      return next
    })
  }
  const updateItem = (i: number, field: 'quantity' | 'sellingPrice', value: number | '') => {
    if (field === 'quantity') clearItemError(i)
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next })
  }
  const updateItemWarehouse = (i: number, w: Warehouse) => {
    clearItemError(i)
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], warehouse: w }; return next })
  }
  const handleProductSelect = (i: number, product: Product) => {
    clearItemError(i)
    setProductCache((prev) => ({ ...prev, [product._id]: product }))
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], product: product._id, sellingPrice: product.sellingPrice }; return next })
  }

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

  /* Validate rồi mở confirm popup */
  const handleFormSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedItems.length === 0) { setError('Vui lòng thêm ít nhất một sản phẩm'); return }
    const missing: Record<number, string[]> = {}
    selectedItems.forEach((it, i) => { if (!it.product) missing[i] = ['Vui lòng chọn sản phẩm'] })
    if (Object.keys(missing).length > 0) {
      setItemErrors(missing)
      setError(`Vui lòng chọn sản phẩm cho ${Object.keys(missing).length} dòng còn trống`)
      return
    }
    setError('')
    setItemErrors({})
    setConfirmOpen(true)
  }

  /* Gọi API với status đã chọn */
  const submitWithStatus = async (status: statusOrders) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(({ product, quantity, sellingPrice, warehouse }) => ({ product, quantity: Number(quantity) || 1, price: sellingPrice, warehouse })),
          ...customerInfo,
          status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401 || res.redirected) {
        window.location.href = '/signin'
        throw new Error(data.error || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
      }
      if (!res.ok) {
        const issues: { index: number; message: string }[] = Array.isArray(data.issues) ? data.issues : []
        if (issues.length > 0) {
          const byIndex: Record<number, string[]> = {}
          for (const { index, message } of issues) (byIndex[index] ??= []).push(message)
          setItemErrors(byIndex)
          setConfirmOpen(false)
          setError(`Có ${Object.keys(byIndex).length} sản phẩm bị lỗi, vui lòng kiểm tra lại`)
          return
        }
        throw new Error(data.error || 'Tạo đơn hàng thất bại')
      }
      onSuccess?.(data)
    } catch (err) {
      setConfirmOpen(false)
      setItemErrors({})
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" /> Tạo đơn hàng mới
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus /> Thêm sản phẩm
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* ── Thông tin khách hàng (compact) ── */}
      <div className="space-y-2 p-3 bg-muted/40 rounded-lg border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Khách hàng <span className="font-normal normal-case text-muted-foreground/70">(tuỳ chọn)</span>
          </p>
          {autoFilled && (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" /> Tự động điền
            </span>
          )}
        </div>

        {/* Tên + SĐT cùng hàng */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="cust-name" className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Họ và tên</Label>
            <NameAutocomplete
              value={customerInfo.name}
              onChange={(val) => { setCustomerInfo((p) => ({ ...p, name: val })); setAutoFilled(false) }}
              onSelect={(c) => { setCustomerInfo({ name: c.name, phone: c.phone, address: c.address ?? '' }); setAutoFilled(true) }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cust-phone" className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Số điện thoại</Label>
            <Input
              id="cust-phone" type="tel" placeholder="Số điện thoại"
              value={customerInfo.phone}
              onChange={(e) => { setCustomerInfo((p) => ({ ...p, phone: e.target.value })); setAutoFilled(false) }}
            />
          </div>
        </div>

        {/* Địa chỉ (tuỳ chọn) */}
        <div className="space-y-1">
          <Label htmlFor="cust-addr" className="text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Địa chỉ
            <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
          </Label>
          <Input
            id="cust-addr" placeholder="Địa chỉ giao hàng"
            value={customerInfo.address}
            onChange={(e) => { setCustomerInfo((p) => ({ ...p, address: e.target.value })); setAutoFilled(false) }}
          />
        </div>
      </div>

      {/* ── Danh sách sản phẩm: từ TWO_COLUMN_THRESHOLD dòng trở lên thì chia 2 cột
             (data-wide báo cho DialogContent bên ngoài nới rộng theo) ── */}
      <div
        data-wide={twoColumns || undefined}
        className={cn('grid gap-2 items-start', twoColumns && 'lg:grid-cols-2')}
      >
        {selectedItems.map((item, index) => {
          const selected = productCache[item.product]
          const rowErrors = itemErrors[index]
          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border space-y-2',
                rowErrors ? 'border-destructive bg-destructive/5' : 'bg-muted/30',
              )}
            >
              {rowErrors && (
                <div className="space-y-0.5">
                  {rowErrors.map((m, j) => (
                    <p key={j} className="text-xs font-medium text-destructive">{m}</p>
                  ))}
                </div>
              )}
              {/* Row 1: tên sản phẩm + nút xoá */}
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <ProductSearch
                    selectedProduct={productCache[item.product]}
                    warehouse={item.warehouse}
                    onSelect={(p) => handleProductSelect(index, p)}
                  />
                </div>
                <Button
                  type="button" variant="ghost" size="icon-sm"
                  onClick={() => removeItem(index)}
                  className="hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Row 2: chọn kho + chỉnh tồn kho inline */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground shrink-0">Kho:</p>
                {(Object.entries(WAREHOUSES) as [Warehouse, string][]).map(([key, label]) => {
                  const stockField = warehouseStockKey[key]
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
                          type="number"
                          min="0"
                          value={stock}
                          onChange={(e) => updateProductStock(selected!._id, stockField, parseInt(e.target.value) || 0)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className={cn(
                            'w-12 h-5 rounded border text-center text-xs tabular-nums bg-background focus:outline-none focus:ring-1 focus:ring-primary',
                            stock === 0
                              ? 'border-destructive/60 text-destructive'
                              : 'border-border text-foreground',
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Row 3: giá vốn (read-only) + giá bán + số lượng */}
              <div className="flex items-end gap-2">
                {selected && (
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground">Giá vốn</p>
                    <p className={cn('text-sm text-muted-foreground line-through', NUMERIC)}>{formatVND(selected.originalPrice)}</p>
                  </div>
                )}
                <div className="w-32 space-y-1 shrink-0">
                  <Label className="text-xs">Giá bán (₫)</Label>
                  <VndInput
                    required className="h-8 text-sm"
                    value={item.sellingPrice}
                    onChange={(v) => updateItem(index, 'sellingPrice', v)}
                  />
                </div>
                <div className="w-16 space-y-1 shrink-0">
                  <Label className="text-xs">SL</Label>
                  <Input
                    type="number" required min="1"
                    inputMode="numeric"
                    className="h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={item.quantity}
                    onChange={(e) => {
                      const v = e.target.value
                      updateItem(index, 'quantity', v === '' ? '' : Math.max(1, parseInt(v) || 1))
                    }}
                    onBlur={() => { if (item.quantity === '') updateItem(index, 'quantity', 1) }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {selectedItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg text-sm">
            Chưa có sản phẩm nào.{' '}
            <button type="button" onClick={addItem} className="font-semibold underline underline-offset-2">
              Thêm sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-3 pt-2 border-t">
        <Button type="submit" disabled={selectedItems.length === 0} className="flex-1">
          Tạo đơn hàng
        </Button>
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus /> Thêm sản phẩm
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        )}
      </div>

      {/* ── Confirm popup (portal ra body để luôn nằm giữa màn hình,
             không bị kẹt ở đầu vùng cuộn của dialog khi đơn nhiều sản phẩm) ── */}
      {confirmOpen && createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">Xác nhận tạo đơn hàng</p>
              <p className="text-sm text-muted-foreground">Chọn trạng thái thanh toán cho đơn hàng này</p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                className="w-full bg-success text-success-foreground hover:bg-success/90 font-semibold"
                disabled={loading}
                onClick={() => submitWithStatus(statusOrders.PAID)}
              >
                {loading ? 'Đang xử lý…' : 'Đã thanh toán'}
              </Button>
              <Button
                type="button" variant="outline" className="w-full"
                disabled={loading}
                onClick={() => submitWithStatus(statusOrders.UNPAID)}
              >
                Chưa thanh toán
              </Button>
              <Button
                type="button" variant="ghost" className="w-full"
                disabled={loading}
                onClick={() => setConfirmOpen(false)}
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </form>
  )
}
