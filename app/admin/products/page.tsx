'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Package, Plus, Search, ShoppingCart, SlidersHorizontal, TrendingUp, X, XCircle } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import OrderForm from '@/components/OrderForm'
import ProductForm from '@/components/ProductForm'
import ProductList from '@/components/ProductList'
import { Order, Product, statusOrders, statusOrdersVN } from '@/lib/types'
import { formatProfit, formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ApiStats {
  total: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
}

const PAGE_SIZE = 10

export default function ProductsPage() {
  const [products, setProducts]             = useState<Product[]>([])
  const [total, setTotal]                   = useState(0)
  const [totalPages, setTotalPages]         = useState(1)
  const [allBrands, setAllBrands]           = useState<string[]>([])
  const [apiStats, setApiStats]             = useState<ApiStats>({ total: 0, lowStock: 0, outOfStock: 0, inventoryValue: 0 })
  const [loading, setLoading]               = useState(true)
  const [formOpen, setFormOpen]             = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [selectedIds, setSelectedIds]             = useState<Set<string>>(new Set())
  const [selectedProductsCache, setSelectedProductsCache] = useState<Map<string, Product>>(new Map())
  const [orderOpen, setOrderOpen]                 = useState(false)
  const [createdOrder, setCreatedOrder]           = useState<Order | null>(null)
  const router = useRouter()

  const handleSelectionChange = (newIds: Set<string>) => {
    setSelectedIds(newIds)
    setSelectedProductsCache((prev) => {
      const next = new Map(prev)
      for (const id of prev.keys()) {
        if (!newIds.has(id)) next.delete(id)
      }
      for (const id of newIds) {
        if (!next.has(id)) {
          const p = products.find((p) => p._id === id)
          if (p) next.set(id, p)
        }
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectedProductsCache(new Map())
  }

  // Input state (immediate UI) — một thanh tìm theo tên hoặc nhãn hàng
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  // Debounced value used in API calls
  const [apiSearch, setApiSearch] = useState('')

  // Debounce text input 350ms, reset page on search change
  useEffect(() => {
    const t = setTimeout(() => {
      setApiSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (apiSearch) params.set('search', apiSearch)
      params.set('page',  page.toString())
      params.set('limit', PAGE_SIZE.toString())

      const res  = await fetch(`/api/products?${params}`)
      const data = await res.json()

      setProducts(data.products)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      if (data.brands?.length)  setAllBrands(data.brands)
      if (data.stats)           setApiStats(data.stats)
    } catch {
      toast.error('Không thể tải sản phẩm')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [apiSearch, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const stats = useMemo(() => [
    { label: 'Tổng sản phẩm', value: apiStats.total.toString(),          color: 'text-blue-600 dark:text-blue-400',       bar: 'bg-blue-500 dark:bg-blue-400',       icon: Package },
    { label: 'Sắp hết hàng',  value: apiStats.lowStock.toString(),       color: 'text-amber-600 dark:text-amber-400',     bar: 'bg-amber-500 dark:bg-amber-400',     icon: AlertCircle },
    { label: 'Hết hàng',      value: apiStats.outOfStock.toString(),      color: 'text-red-600 dark:text-red-400',         bar: 'bg-red-500 dark:bg-red-400',         icon: XCircle },
    { label: 'Giá trị kho',   value: formatVND(apiStats.inventoryValue),  color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400', icon: TrendingUp },
  ], [apiStats])

  const openCreate = () => { setEditingProduct(null); setFormOpen(true) }
  const openEdit   = (p: Product) => { setEditingProduct(p); setFormOpen(true) }
  const closeForm  = () => { setFormOpen(false); setEditingProduct(null) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const tid = toast.loading('Đang xóa sản phẩm…')
    try {
      const res = await fetch(`/api/products/${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Xóa thất bại') }

      // Gỡ khỏi vùng chọn nếu sản phẩm bị xóa đang được chọn
      if (selectedIds.has(deleteTarget)) {
        const next = new Set(selectedIds)
        next.delete(deleteTarget)
        handleSelectionChange(next)
      }

      const deletedId = deleteTarget
      setDeleteTarget(null)
      toast.success('Đã xóa sản phẩm', { id: tid })

      // Nếu trang hiện tại rỗng đi sau khi xóa thì lùi về trang trước,
      // ngược lại tải lại trang hiện tại để kéo bù 1 sản phẩm từ trang sau.
      const newTotalPages = Math.max(1, Math.ceil((total - 1) / PAGE_SIZE))
      const isLastOnPage   = products.length === 1 && products[0]?._id === deletedId
      if (isLastOnPage && page > newTotalPages) {
        setPage(newTotalPages) // effect sẽ tự tải lại
      } else {
        // Tải lại "im lặng": không hiện skeleton nên vị trí màn hình không đổi,
        // danh sách vẫn đủ PAGE_SIZE nhờ bù từ trang kế tiếp.
        await fetchProducts(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', { id: tid })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AppShell
      title="Sản phẩm"
      description="Quản lý kho hàng và bảng giá"
      productBadge={apiStats.lowStock || undefined}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Kho hàng</h2>
          <p className="text-sm text-muted-foreground">Quản lý tồn kho và giá cả</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}><Plus /> Thêm sản phẩm</Button>
          <Button variant="outline"><SlidersHorizontal /> Thao tác khác</Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading && apiStats.total === 0
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : stats.map((s) => (
              <Card key={s.label} size="sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <div className="mt-1 flex items-end justify-between">
                    <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                    <span className={cn('mb-1 h-1 w-6 rounded-full', s.bar)} />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Search ── */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc nhãn hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            list="brand-list"
          />
          <datalist id="brand-list">
            {allBrands.map((b) => <option key={b} value={b} />)}
          </datalist>
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <XCircle className="h-4 w-4" /> Xóa bộ lọc
          </Button>
        )}
      </div>

{!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Hiển thị {products.length} trong {total} sản phẩm
          {total !== apiStats.total && ` (đã lọc từ ${apiStats.total})`}
        </p>
      )}

      {/* ── Table ── */}
      <ProductList
        products={products}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(id)}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => { setPage(p); clearSelection() }}
        className="mt-4"
      />

      {/* ── Floating action bar khi có sản phẩm được chọn ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border bg-card shadow-xl px-5 py-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium text-muted-foreground">
            Đã chọn <span className="font-bold text-foreground">{selectedIds.size}</span> sản phẩm
          </span>
          <Button size="sm" onClick={() => setOrderOpen(true)}>
            <ShoppingCart className="h-4 w-4" /> Tạo đơn hàng
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={clearSelection} title="Bỏ chọn">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Product form dialog ── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editingProduct?._id ?? 'new'}
            initialData={editingProduct}
            onSuccess={(product) => {
              closeForm()
              if (editingProduct) {
                setProducts((prev) => prev.map((p) => p._id === product._id ? product : p))
              } else {
                fetchProducts(true)
              }
              toast.success(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm')
            }}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* ── Order from selection dialog ── */}
      <Dialog open={orderOpen} onOpenChange={(open) => !open && setOrderOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đơn hàng</DialogTitle>
          </DialogHeader>
          <OrderForm
            key={[...selectedIds].join(',')}
            initialItems={[...selectedProductsCache.values()].map((p) => ({
              product: p._id,
              quantity: 1,
              sellingPrice: p.sellingPrice,
            }))}
            onSuccess={(order) => {
              setOrderOpen(false)
              clearSelection()
              setCreatedOrder(order)
            }}
            onCancel={() => setOrderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Order success preview ── */}
      <Dialog
        open={!!createdOrder}
        onOpenChange={(open) => {
          if (!open) { setCreatedOrder(null); router.push('/admin/orders') }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {createdOrder && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-1">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold">Đơn hàng đã được tạo!</h2>
                <p className="text-muted-foreground text-sm">
                  {new Date(createdOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                <span className="text-xs font-mono text-muted-foreground">
                  #{createdOrder._id.slice(-10).toUpperCase()}
                </span>
                <span className={cn(
                  'text-xs font-bold uppercase px-2 py-0.5 rounded-md border',
                  createdOrder.status === statusOrders.UNPAID
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                )}>
                  {statusOrdersVN[createdOrder.status] ?? createdOrder.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Khách hàng</p>
                <p className="font-medium">{createdOrder.name}</p>
                <p className="text-sm text-muted-foreground">{createdOrder.phone}</p>
                {createdOrder.address && <p className="text-sm text-muted-foreground/70">{createdOrder.address}</p>}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sản phẩm</p>
                <div className="divide-y rounded-lg border overflow-hidden">
                  {createdOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-card text-sm">
                      <span><span className="font-semibold">{item.quantity}×</span> {item.name}</span>
                      <span className="text-muted-foreground">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatVND(createdOrder.totalAmount)}
                </span>
              </div>

              <div className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg border',
                createdOrder.profit > 0 && 'bg-emerald-500/10 border-emerald-500/30',
                createdOrder.profit < 0 && 'bg-red-500/10 border-red-500/30',
                createdOrder.profit === 0 && 'bg-muted/40',
              )}>
                <span className="text-sm font-semibold">{createdOrder.profit >= 0 ? 'Lãi' : 'Lỗ'}</span>
                <span className={cn(
                  'text-base font-bold tabular-nums',
                  createdOrder.profit > 0 && 'text-emerald-600 dark:text-emerald-400',
                  createdOrder.profit < 0 && 'text-red-600 dark:text-red-400',
                )}>
                  {formatProfit(createdOrder.profit)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => { setCreatedOrder(null); router.push('/admin/orders') }}
              >
                Xem đơn hàng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm này sẽ bị xóa vĩnh viễn khỏi kho hàng. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleteLoading} onClick={confirmDelete}>
              {deleteLoading ? 'Đang xóa…' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
