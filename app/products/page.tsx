'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= 5).length, [products])

  const stats = useMemo(() => {
    const outOfStock  = products.filter((p) => p.stock === 0).length
    const inventoryValue = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)
    return [
      { label: 'Total Products', value: products.length.toString(), color: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500 dark:bg-blue-400', icon: Package },
      { label: 'Low Stock', value: lowStockCount.toString(), color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500 dark:bg-amber-400', icon: AlertCircle },
      { label: 'Out of Stock', value: outOfStock.toString(), color: 'text-red-600 dark:text-red-400', bar: 'bg-red-500 dark:bg-red-400', icon: XCircle },
      { label: 'Inventory Value', value: formatVND(inventoryValue), color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400', icon: TrendingUp },
    ]
  }, [products, lowStockCount])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return !q ? products : products.filter((p) => p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q))
  }, [products, search])

  const openCreate = () => { setEditingProduct(null); setFormOpen(true) }
  const openEdit   = (p: Product) => { setEditingProduct(p); setFormOpen(true) }
  const closeForm  = () => { setFormOpen(false); setEditingProduct(null) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const tid = toast.loading('Deleting product…')
    try {
      const res = await fetch(`/api/products/${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setDeleteTarget(null)
      fetchProducts()
      toast.success('Product deleted', { id: tid })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete', { id: tid })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AppShell
      title="Products"
      description="Manage your inventory and pricing"
      productBadge={lowStockCount || undefined}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage your stock and prices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}><Plus /> Add Product</Button>
          <Button variant="outline"><SlidersHorizontal /> More Actions</Button>
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
          <Input placeholder="Search by name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <XCircle className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      )}

      {/* ── Table ── */}
      <ProductList
        products={filteredProducts}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(id)}
        loading={loading}
      />

      {/* ── Product form dialog ── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editingProduct?._id ?? 'new'}
            initialData={editingProduct}
            onSuccess={() => {
              closeForm()
              fetchProducts()
              toast.success(editingProduct ? 'Product updated' : 'Product created')
            }}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be permanently removed from your inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleteLoading} onClick={confirmDelete}>
              {deleteLoading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
