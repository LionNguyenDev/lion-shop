'use client'

import { MapPin, Phone, Plus, ShoppingCart, Trash2, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatVND } from '@/lib/format'
import { Customer, Order, Product, statusOrders, WAREHOUSES, Warehouse } from '@/lib/types'
import VndInput from './VndInput'
import { ProductSearch, useDebouncedValue, warehouseStockKey } from './ProductSearch'
import { cn } from '@/lib/utils'
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
  const removeItem = (i: number) => setSelectedItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: 'quantity' | 'sellingPrice', value: number | '') =>
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next })
  const updateItemWarehouse = (i: number, w: Warehouse) =>
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], warehouse: w }; return next })
  const handleProductSelect = (i: number, product: Product) => {
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
    if (selectedItems.length === 0)            { setError('Vui lòng thêm ít nhất một sản phẩm'); return }
    if (selectedItems.some((it) => !it.product)) { setError('Vui lòng chọn sản phẩm cho mỗi dòng'); return }
    setError('')
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Tạo đơn hàng thất bại')
      onSuccess?.(data)
    } catch (err) {
      setConfirmOpen(false)
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
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* ── Thông tin khách hàng (compact) ── */}
      <div className="space-y-2 p-3 bg-muted/40 rounded-lg border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Khách hàng <span className="font-normal normal-case text-muted-foreground/70">(tuỳ chọn)</span>
          </p>
          {autoFilled && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /> Tự động điền
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

      {/* ── Danh sách sản phẩm ── */}
      <div className="space-y-2">
        {selectedItems.map((item, index) => {
          const selected = productCache[item.product]
          return (
            <div key={index} className="p-3 bg-muted/30 rounded-lg border space-y-2">
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
                <p className="text-[11px] text-muted-foreground shrink-0">Kho:</p>
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
                              ? 'border-red-400 text-red-500 dark:border-red-600'
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
                    <p className="text-[11px] text-muted-foreground">Giá vốn</p>
                    <p className="text-sm text-muted-foreground line-through">{formatVND(selected.originalPrice)}</p>
                  </div>
                )}
                <div className="w-32 space-y-1 shrink-0">
                  <Label className="text-[11px]">Giá bán (₫)</Label>
                  <VndInput
                    required className="h-8 text-sm"
                    value={item.sellingPrice}
                    onChange={(v) => updateItem(index, 'sellingPrice', v)}
                  />
                </div>
                <div className="w-16 space-y-1 shrink-0">
                  <Label className="text-[11px]">SL</Label>
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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        )}
      </div>

      {/* ── Confirm popup ── */}
      {confirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-xs rounded-2xl border bg-card p-6 shadow-2xl space-y-4">
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold"
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
        </div>
      )}
    </form>
  )
}
