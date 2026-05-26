'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { AlertCircle, Package, Plus, Search, SlidersHorizontal, TrendingUp, XCircle } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import ProductForm from '@/components/ProductForm'
import ProductList from '@/components/ProductList'
import { Product } from '@/lib/types'
import { formatVND } from '@/lib/format'
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

export default function ProductsPage() {
  const [products, setProducts]             = useState<Product[]>([])
  const [loading, setLoading]               = useState(true)
  const [formOpen, setFormOpen]             = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [search, setSearch]                 = useState('')
  const [page, setPage]                     = useState(1)
  const PAGE_SIZE = 10

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const lowStockCount = useMemo(() => products.filter((p) => p.stock < 20).length, [products])

  const stats = useMemo(() => {
    const outOfStock     = products.filter((p) => p.stock === 0).length
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)
    return [
      { label: 'Tổng sản phẩm',  value: products.length.toString(),   color: 'text-blue-600 dark:text-blue-400',    bar: 'bg-blue-500 dark:bg-blue-400',    icon: Package },
      { label: 'Sắp hết hàng',   value: lowStockCount.toString(),      color: 'text-amber-600 dark:text-amber-400',  bar: 'bg-amber-500 dark:bg-amber-400',  icon: AlertCircle },
      { label: 'Hết hàng',       value: outOfStock.toString(),         color: 'text-red-600 dark:text-red-400',      bar: 'bg-red-500 dark:bg-red-400',      icon: XCircle },
      { label: 'Giá trị kho',    value: formatVND(inventoryValue),     color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400', icon: TrendingUp },
    ]
  }, [products, lowStockCount])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return !q ? products : products.filter((p) => p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q))
  }, [products, search])

  const totalPages    = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
      setDeleteTarget(null)
      fetchProducts()
      toast.success('Đã xóa sản phẩm', { id: tid })
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
      productBadge={lowStockCount || undefined}
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
        {loading
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
      <div className="mb-4 flex gap-3">
        <div className="relative min-w-56 flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc mã…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPage(1) }}>
            <XCircle className="h-4 w-4" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      {!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Hiển thị {pagedProducts.length} trong {filteredProducts.length} sản phẩm
          {filteredProducts.length !== products.length && ` (đã lọc từ ${products.length})`}
        </p>
      )}

      {/* ── Table ── */}
      <ProductList
        products={pagedProducts}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(id)}
        loading={loading}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-4"
      />

      {/* ── Product form dialog ── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editingProduct?._id ?? 'new'}
            initialData={editingProduct}
            onSuccess={() => {
              closeForm()
              fetchProducts()
              toast.success(editingProduct ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm')
            }}
            onCancel={closeForm}
          />
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
