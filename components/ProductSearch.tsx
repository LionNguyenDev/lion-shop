'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatVND } from '@/lib/format'
import { Product, Warehouse } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

/* ── Debounce hook ── */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export const warehouseStockKey: Record<Warehouse, 'stockHN' | 'stockQB' | 'stockSG'> = {
  HN: 'stockHN', QB: 'stockQB', SG: 'stockSG',
}

/* ── Product search (server-side, limit 10 + load-more khi scroll) ── */
const PRODUCT_PAGE_SIZE = 10

interface ProductSearchProps {
  selectedProduct?: Product
  warehouse: Warehouse
  onSelect: (product: Product) => void
  /** Tên hiển thị khi chưa tải được sản phẩm (vd: sản phẩm có sẵn trong đơn) */
  fallbackName?: string
}

export function ProductSearch({ selectedProduct, warehouse, onSelect, fallbackName }: ProductSearchProps) {
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
            !selectedProduct && !fallbackName && 'text-muted-foreground',
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
          ) : fallbackName ? (
            <>
              <span className="truncate flex-1 font-medium">{fallbackName}</span>
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
