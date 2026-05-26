'use client'

import { MapPin, Phone, Plus, Search, ShoppingCart, Trash2, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { formatVND } from '@/lib/format'
import { Customer, Order, Product, statusOrders } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface OrderFormProps {
  onSuccess?: (order: Order) => void
  onCancel?: () => void
}

const STATUS_OPTIONS = [statusOrders.UNPAID, statusOrders.PAID] as const

const statusActiveClass: Record<string, string> = {
  [statusOrders.UNPAID]: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  [statusOrders.PAID]:   'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
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

/* ── Name autocomplete sub-component ── */
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const pick = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0]
      if (pick) { e.preventDefault(); onSelect(pick); setOpen(false) }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id="cust-name"
        required
        placeholder="Họ và tên"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const val = e.target.value
          onChange(val)
          if (val.trim().length < 1) { setSuggestions([]); setOpen(false) }
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden"
        >
          {suggestions.map((c, i) => (
            <li
              key={c._id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(c)
                setOpen(false)
              }}
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

/* ── Product search sub-component dùng trong mỗi dòng item ── */
interface ProductSearchProps {
  value: string                       // product id đang chọn
  products: Product[]                 // toàn bộ danh sách
  onSelect: (product: Product) => void
}

function ProductSearch({ value, products, onSelect }: ProductSearchProps) {
  const [query, setQuery]             = useState('')
  const [open, setOpen]               = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef                  = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  const selected = products.find((p) => p._id === value)

  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p._id.toLowerCase().includes(query.toLowerCase()),
      )
    : products

  /* Click-outside → close */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = activeIndex >= 0 ? filtered[activeIndex] : filtered[0]
      if (pick) { onSelect(pick); setOpen(false); setQuery('') }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  /* Khi click vào trigger (hiển thị sản phẩm đã chọn) → mở search */
  const openSearch = () => {
    setOpen(true)
    setQuery('')
    setActiveIndex(-1)
    // focus input sau khi render
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger — hiện sản phẩm đã chọn hoặc placeholder */}
      {!open ? (
        <button
          type="button"
          onClick={openSearch}
          className={cn(
            'w-full flex items-center gap-2 h-8 px-3 rounded-lg border bg-background text-sm text-left transition-colors hover:bg-muted',
            !selected && 'text-muted-foreground',
          )}
        >
          {selected ? (
            <>
              <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border bg-muted">
                {selected.image && (
                  <Image src={selected.image} alt={selected.name} fill sizes="20px" className="object-cover" />
                )}
              </span>
              <span className="truncate flex-1">{selected.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {selected.stock} trong kho
              </span>
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span>Tìm sản phẩm…</span>
            </>
          )}
        </button>
      ) : (
        /* Search input */
        <Input
          ref={inputRef}
          placeholder="Tìm theo tên sản phẩm…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="h-8 text-sm"
        />
      )}

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              Không tìm thấy sản phẩm
            </li>
          ) : (
            filtered.map((p, i) => (
              <li
                key={p._id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(p)
                  setOpen(false)
                  setQuery('')
                }}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors select-none',
                  i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
                  p.stock <= 0 && 'opacity-50 pointer-events-none',
                )}
              >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded border bg-muted">
                  {p.image && (
                    <Image src={p.image} alt={p.name} fill sizes="28px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {p.stock <= 0 ? 'Hết hàng' : `${p.stock} trong kho`} · {formatVND(p.sellingPrice)}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

/* ── Main form ── */
export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const [products, setProducts]       = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<
    { product: string; quantity: number; sellingPrice: number }[]
  >([])
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '' })
  const [status, setStatus]           = useState<statusOrders>(statusOrders.UNPAID)
  const [autoFilled, setAutoFilled]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  /* Load danh sách sản phẩm */
  useEffect(() => {
    let ignore = false
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!ignore) setProducts(data)
      } catch {
        if (!ignore) setError('Không thể tải sản phẩm')
      }
    }
    fetchProducts()
    return () => { ignore = true }
  }, [])

  /* Phone auto-fill */
  const debouncedPhone = useDebouncedValue(customerInfo.phone, 400)

  useEffect(() => {
    const phone = debouncedPhone.trim()
    if (phone.length < 8) return
    let cancelled = false
    fetch(`/api/customers?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data: Customer | null) => {
        if (cancelled || !data) return
        setCustomerInfo({ name: data.name, phone: data.phone, address: data.address })
        setAutoFilled(true)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [debouncedPhone])

  /* Item helpers */
  const addItem = () =>
    setSelectedItems((prev) => [...prev, { product: '', quantity: 1, sellingPrice: 0 }])

  const removeItem = (index: number) =>
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))

  const updateItem = (index: number, field: 'quantity' | 'sellingPrice', value: number) => {
    setSelectedItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleProductSelect = (index: number, product: Product) => {
    setSelectedItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], product: product._id, sellingPrice: product.sellingPrice }
      return next
    })
  }

  /* Submit */
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedItems.length === 0) { setError('Vui lòng thêm ít nhất một sản phẩm'); return }
    if (selectedItems.some((it) => !it.product)) { setError('Vui lòng chọn sản phẩm cho mỗi dòng'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(({ product, quantity, sellingPrice }) => ({
            product,
            quantity,
            price: sellingPrice,
          })),
          ...customerInfo,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Tạo đơn hàng thất bại')
      onSuccess?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Tạo đơn hàng mới
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus /> Thêm sản phẩm
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Trạng thái đơn hàng */}
      <div className="space-y-1.5">
        <Label>Trạng thái đơn hàng</Label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                status === s
                  ? statusActiveClass[s]
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Thông tin khách hàng */}
      <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Khách hàng</p>
          {autoFilled && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tự động điền khách hàng
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-name"><User className="w-3.5 h-3.5" /> Họ và tên</Label>
          <NameAutocomplete
            value={customerInfo.name}
            onChange={(val) => {
              setCustomerInfo((p) => ({ ...p, name: val }))
              setAutoFilled(false)
            }}
            onSelect={(c) => {
              setCustomerInfo({ name: c.name, phone: c.phone, address: c.address })
              setAutoFilled(true)
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-phone"><Phone className="w-3.5 h-3.5" /> Số điện thoại</Label>
          <Input
            id="cust-phone" type="tel" required placeholder="Số điện thoại"
            value={customerInfo.phone}
            onChange={(e) => {
              setCustomerInfo((p) => ({ ...p, phone: e.target.value }))
              setAutoFilled(false)
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-addr"><MapPin className="w-3.5 h-3.5" /> Địa chỉ</Label>
          <Textarea
            id="cust-addr" required placeholder="Địa chỉ giao hàng"
            value={customerInfo.address} rows={2}
            onChange={(e) => {
              setCustomerInfo((p) => ({ ...p, address: e.target.value }))
              setAutoFilled(false)
            }}
          />
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="space-y-2">
        {selectedItems.map((item, index) => {
          const selected = products.find((p) => p._id === item.product)
          return (
            <div key={index} className="flex gap-2 items-end p-3 bg-muted/30 rounded-lg border">
              {/* Tìm kiếm sản phẩm */}
              <div className="flex-1 space-y-1 min-w-0">
                <Label className="text-xs">Sản phẩm</Label>
                <ProductSearch
                  value={item.product}
                  products={products}
                  onSelect={(p) => handleProductSelect(index, p)}
                />
              </div>

              {/* Giá vốn (chỉ đọc) */}
              {selected && (
                <div className="w-28 space-y-1 shrink-0">
                  <Label className="text-xs">Giá vốn</Label>
                  <div className="h-8 px-2.5 flex items-center rounded-lg border bg-muted text-sm text-muted-foreground line-through">
                    {formatVND(selected.originalPrice)}
                  </div>
                </div>
              )}

              {/* Giá bán */}
              <div className="w-28 space-y-1 shrink-0">
                <Label className="text-xs">Giá bán (₫)</Label>
                <Input
                  type="number" required min="0"
                  value={item.sellingPrice}
                  onChange={(e) => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Số lượng */}
              <div className="w-16 space-y-1 shrink-0">
                <Label className="text-xs">SL</Label>
                <Input
                  type="number" required min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>

              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => removeItem(index)}
                className="hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 />
              </Button>
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

      {/* Footer */}
      <div className="flex gap-3 pt-2 border-t">
        <Button
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-semibold"
        >
          {loading ? 'Đang xử lý…' : 'Đặt hàng'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
        )}
      </div>
    </form>
  )
}
