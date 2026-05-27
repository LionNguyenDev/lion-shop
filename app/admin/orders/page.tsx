'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { CheckCircle, ListOrdered, Plus, Search, SlidersHorizontal, XCircle } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import OrderList from '@/components/OrderList'
import OrderForm from '@/components/OrderForm'
import OrderEditModal from '@/components/OrderEditModal'
import OrderDetailModal from '@/components/OrderDetailModal'
import { formatProfit, formatVND } from '@/lib/format'
import { Order, statusOrders, statusOrdersVN } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type CreateModal = 'closed' | 'form' | 'success'

const PAYMENT_STATUSES = [statusOrders.PAID, statusOrders.UNPAID]

const statusBadgeClass: Record<string, string> = {
  [statusOrders.UNPAID]:     'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30',
  [statusOrders.PAID]:       'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
  [statusOrders.PROCESSING]: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
  [statusOrders.COMPLETED]:  'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 dark:border-zinc-500/30',
}

export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [loading, setLoading]             = useState(true)
  const [createModal, setCreateModal]     = useState<CreateModal>('closed')
  const [createdOrder, setCreatedOrder]   = useState<Order | null>(null)
  const [editingOrder, setEditingOrder]   = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [page, setPage]                   = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const PAGE_SIZE = 10

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data)
    } catch {
      toast.error('Không thể tải đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const unpaidCount = useMemo(
    () => orders.filter((o) => o.status === statusOrders.UNPAID).length,
    [orders],
  )

  /* ── Stats ── */
  const stats = useMemo(() => [
    { label: 'Tổng cộng', value: orders.length, color: 'text-foreground', bar: 'bg-primary' },
    { label: 'Chưa thanh toán', value: orders.filter((o) => o.status === statusOrders.UNPAID).length, color: 'text-red-600 dark:text-red-400', bar: 'bg-red-500 dark:bg-red-400' },
    { label: 'Hoàn thành', value: orders.filter((o) => o.status === statusOrders.COMPLETED).length, color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400' },
    { label: 'Đã hủy', value: orders.filter((o) => o.status === statusOrders.CANCELLED || o.status === statusOrders.FAILED).length, color: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500 dark:bg-orange-400' },
  ], [orders])

  /* ── Filter ── */
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      const matchSearch = !q || o.name?.toLowerCase().includes(q) || o._id.toLowerCase().includes(q) || o.phone?.includes(q)
      const matchStatus = !statusFilter || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const totalPages   = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders  = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* ── Actions ── */
  const handleCreateSuccess = (order: Order) => {
    setCreatedOrder(order)
    setCreateModal('success')
    fetchOrders()
  }

  const handleEditSaved = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
    setEditingOrder(null)
    toast.success('Đã cập nhật đơn hàng')
  }

  const handleComplete = async (order: Order) => {
    const tid = toast.loading('Đang đánh dấu hoàn thành…')
    const res  = await fetch(`/api/orders/${order._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusOrders.PAID }),
    })
    const data = await res.json()
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)))
      toast.success('Đơn hàng đã hoàn thành', { id: tid })
    } else {
      toast.error(data.error ?? 'Cập nhật thất bại', { id: tid })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const tid = toast.loading('Đang xóa đơn hàng…')
    try {
      const res = await fetch(`/api/orders/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Xóa đơn hàng thất bại')
      }
      setOrders((prev) => prev.filter((o) => o._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Đã xóa đơn hàng', { id: tid })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', { id: tid })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AppShell
      title="Đơn hàng"
      description="Quản lý và theo dõi tất cả đơn hàng"
      orderBadge={unpaidCount || undefined}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Danh sách đơn hàng</h2>
          <p className="text-sm text-muted-foreground">Quản lý và theo dõi tất cả đơn hàng của bạn</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateModal('form')}>
            <Plus /> Thêm đơn hàng
          </Button>
          <Button variant="outline">
            <SlidersHorizontal /> Thao tác khác
          </Button>
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
                    <p className={cn('text-2xl font-bold tabular-nums', s.color)}>
                      {s.value.toLocaleString('vi-VN')}
                    </p>
                    <span className={cn('mb-1 h-1 w-6 rounded-full', s.bar)} />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Filters ── */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, SĐT, mã đơn…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ''); setPage(1) }}>
          <SelectTrigger className="w-44">
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Trạng thái thanh toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusOrdersVN[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}>
            <XCircle className="h-4 w-4" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      {!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Hiển thị {pagedOrders.length} trong {filteredOrders.length} đơn hàng
          {filteredOrders.length !== orders.length && ` (đã lọc từ ${orders.length})`}
        </p>
      )}

      {/* ── Table ── */}
      <OrderList
        orders={pagedOrders}
        loading={loading}
        onEdit={setEditingOrder}
        onDelete={setDeleteTarget}
        onComplete={handleComplete}
        onRowClick={setSelectedOrder}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-4"
      />

      {/* ── Create / Success dialog ── */}
      <Dialog
        open={createModal !== 'closed'}
        onOpenChange={(open) => !open && setCreateModal('closed')}
      >
        <DialogContent className={cn('max-h-[90vh] overflow-y-auto', createModal === 'form' ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
          {createModal === 'form' && (
            <>
              <DialogHeader><DialogTitle>Đơn hàng mới</DialogTitle></DialogHeader>
              <OrderForm onSuccess={handleCreateSuccess} onCancel={() => setCreateModal('closed')} />
            </>
          )}

          {createModal === 'success' && createdOrder && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-1">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold">Đơn hàng đã được tạo!</h2>
                <p className="text-muted-foreground text-sm">{new Date(createdOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border">
                <span className="text-xs font-mono text-muted-foreground">#{createdOrder._id.slice(-10).toUpperCase()}</span>
                <Badge variant="outline" className={cn('text-xs font-bold uppercase', statusBadgeClass[createdOrder.status] ?? 'bg-slate-100 text-slate-600')}>
                  {createdOrder.status}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Khách hàng</p>
                <p className="font-medium">{createdOrder.name}</p>
                <p className="text-sm text-muted-foreground">{createdOrder.phone}</p>
                <p className="text-sm text-muted-foreground/70">{createdOrder.address}</p>
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
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatVND(createdOrder.totalAmount)}</span>
              </div>
              <div className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg border',
                createdOrder.profit > 0 && 'bg-emerald-500/10 border-emerald-500/30',
                createdOrder.profit < 0 && 'bg-red-500/10 border-red-500/30',
                createdOrder.profit === 0 && 'bg-muted/40',
              )}>
                <span className="text-sm font-semibold">
                  {createdOrder.profit >= 0 ? 'Lãi' : 'Lỗ'}
                </span>
                <span className={cn(
                  'text-base font-bold tabular-nums',
                  createdOrder.profit > 0 && 'text-emerald-600 dark:text-emerald-400',
                  createdOrder.profit < 0 && 'text-red-600 dark:text-red-400',
                )}>
                  {formatProfit(createdOrder.profit)}
                </span>
              </div>
              <Button className="w-full" onClick={() => { setCreateModal('closed'); toast.success('Đơn hàng đã tạo thành công!') }}>Xong</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit ── */}
      <OrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSaved={handleEditSaved} />

      {/* ── Delete ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn hàng <span className="font-mono font-semibold text-foreground">#{deleteTarget?._id.slice(-8).toUpperCase()}</span> của{' '}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> sẽ bị xóa vĩnh viễn.
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

      {/* ── Order Detail Modal ── */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </AppShell>
  )
}
