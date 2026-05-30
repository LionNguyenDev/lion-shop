'use client'

import { MapPin, Phone, Plus, Search, ShoppingCart, Trash2, User } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatVND } from '@/lib/format'
import { Customer, Order, Product, statusOrders, WAREHOUSES, Warehouse } from '@/lib/types'
import VndInput from './VndInput'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderFormProps {
  onSuccess?: (order: Order) => void
  onCancel?: () => void
  initialItems?: { product: string; quantity: number; sellingPrice: number; warehouse?: Warehouse }[]
}

/* ── Debounce hook ── */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
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

const warehouseStockKey: Record<Warehouse, 'stockHN' | 'stockQB' | 'stockSG'> = {
  HN: 'stockHN', QB: 'stockQB', SG: 'stockSG',
}

/* ── Product search (server-side, limit 10 + load-more khi scroll) ── */
const PRODUCT_PAGE_SIZE = 10

interface ProductSearchProps {
  selectedProduct?: Product
  warehouse: Warehouse
  onSelect: (product: Product) => void
}

function ProductSearch({ selectedProduct, warehouse, onSelect }: ProductSearchProps) {
  const stockKey = warehouseStockKey[warehouse]
  const warehouseStock = (p: Product) => p[stockKey] ?? 0

  const [query, setQuery]             = useState('')
  const [open, setOpen]               = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [results, setResults]         = useState<Product[]>([])
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [loading, setLoading]         = useState(false)
  const containerRef                  = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const reqIdRef                      = useRef(0)

  const debouncedQuery = useDebouncedValue(query, 300)

  const fetchPage = useCallback(async (pageToLoad: number, q: string, append: boolean) => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageToLoad), limit: String(PRODUCT_PAGE_SIZE) })
      if (q.trim()) params.set('search', q.trim())
      const res  = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      if (reqIdRef.current !== reqId) return // bỏ qua phản hồi cũ
      const list: Product[] = data.products ?? []
      setResults((prev) => {
        if (!append) return list
        const seen = new Set(prev.map((p) => p._id))
        return [...prev, ...list.filter((p) => !seen.has(p._id))]
      })
      setTotalPages(data.totalPages ?? 1)
      setPage(pageToLoad)
    } catch {
      if (reqIdRef.current === reqId && !append) setResults([])
    } finally {
      if (reqIdRef.current === reqId) setLoading(false)
    }
  }, [])

  /* Mở dropdown hoặc đổi từ khoá → tải lại từ trang đầu */
  useEffect(() => {
    if (!open) return
    setActiveIndex(-1)
    fetchPage(1, debouncedQuery, false)
  }, [open, debouncedQuery, fetchPage])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    if (loading || page >= totalPages) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) fetchPage(page + 1, debouncedQuery, true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (pick) { onSelect(pick); setOpen(false); setQuery('') }
    } else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  const openSearch = () => { setOpen(true); setQuery(''); setActiveIndex(-1); setTimeout(() => inputRef.current?.focus(), 0) }

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <button
          type="button" onClick={openSearch}
          className={cn(
            'w-full flex items-center gap-2 h-8 px-3 rounded-lg border bg-background text-sm text-left transition-colors hover:bg-muted',
            !selectedProduct && 'text-muted-foreground',
          )}
        >
          {selectedProduct ? (
            <>
              <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border bg-muted">
                {selectedProduct.image && <Image src={selectedProduct.image} alt={selectedProduct.name} fill sizes="20px" className="object-cover" />}
              </span>
              <span className="truncate flex-1 font-medium">{selectedProduct.name}</span>
              <span className={cn('text-xs shrink-0', warehouseStock(selectedProduct) === 0 ? 'text-red-500' : 'text-muted-foreground')}>
                {warehouseStock(selectedProduct)} trong kho
              </span>
            </>
          ) : (
            <><Search className="h-3.5 w-3.5 shrink-0" /><span>Tìm sản phẩm…</span></>
          )}
        </button>
      ) : (
        <Input ref={inputRef} placeholder="Tìm theo tên sản phẩm…" value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
          onKeyDown={handleKeyDown} autoComplete="off" className="h-8 text-sm"
        />
      )}
      {open && (
        <ul
          role="listbox" onScroll={handleScroll}
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              {loading ? 'Đang tải…' : 'Không tìm thấy sản phẩm'}
            </li>
          ) : (
            <>
              {results.map((p, i) => (
                <li
                  key={p._id} role="option" aria-selected={i === activeIndex}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(p); setOpen(false); setQuery('') }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors select-none',
                    i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
                    warehouseStock(p) <= 0 && 'opacity-50 pointer-events-none',
                  )}
                >
                  <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded border bg-muted">
                    {p.image && <Image src={p.image} alt={p.name} fill sizes="28px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {warehouseStock(p) <= 0 ? 'Hết hàng' : `${warehouseStock(p)} trong kho`} · {formatVND(p.sellingPrice)}
                    </span>
                  </span>
                </li>
              ))}
              {loading && (
                <li className="px-3 py-2 text-center text-xs text-muted-foreground">Đang tải thêm…</li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

/* ── Main form ── */
export default function OrderForm({ onSuccess, onCancel, initialItems }: OrderFormProps) {
  const [productCache, setProductCache] = useState<Record<string, Product>>({})
  const [selectedItems, setSelectedItems] = useState<
    { product: string; quantity: number; sellingPrice: number; warehouse: Warehouse }[]
  >((initialItems ?? []).map((it) => ({ ...it, warehouse: it.warehouse ?? 'HN' })))
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

  const addItem    = () => setSelectedItems((prev) => [...prev, { product: '', quantity: 1, sellingPrice: 0, warehouse: 'HN' }])
  const removeItem = (i: number) => setSelectedItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: 'quantity' | 'sellingPrice', value: number) =>
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next })
  const updateItemWarehouse = (i: number, w: Warehouse) =>
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], warehouse: w }; return next })
  const handleProductSelect = (i: number, product: Product) => {
    setProductCache((prev) => ({ ...prev, [product._id]: product }))
    setSelectedItems((prev) => { const next = [...prev]; next[i] = { ...next[i], product: product._id, sellingPrice: product.sellingPrice }; return next })
  }

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
          items: selectedItems.map(({ product, quantity, sellingPrice, warehouse }) => ({ product, quantity, price: sellingPrice, warehouse })),
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

              {/* Row 2: chọn kho */}
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-muted-foreground shrink-0">Kho:</p>
                {(Object.entries(WAREHOUSES) as [Warehouse, string][]).map(([key, label]) => (
                  <button
                    key={key} type="button"
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
                ))}
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
                    type="number" required min="1" className="h-8 text-sm"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
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
