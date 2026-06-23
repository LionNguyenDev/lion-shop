'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { CalendarDays, CheckCircle, Eye, EyeOff, ListOrdered, Plus, Search, SlidersHorizontal, Trash2, XCircle } from 'lucide-react'
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
import { DateInput } from '@/components/ui/date-input'
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
const PAGE_SIZE = 10

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const statusBadgeClass: Record<string, string> = {
  [statusOrders.UNPAID]: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30',
  [statusOrders.PAID]:   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
}

interface OrderStats { total: number; unpaid: number; paid: number; revenue: number }

export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [serverStats, setServerStats]     = useState<OrderStats>({ total: 0, unpaid: 0, paid: 0, revenue: 0 })
  const [total, setTotal]                 = useState(0)
  const [totalPages, setTotalPages]       = useState(1)
  const [loading, setLoading]             = useState(true)
  const [createModal, setCreateModal]     = useState<CreateModal>('closed')
  const [createdOrder, setCreatedOrder]   = useState<Order | null>(null)
  const [showCreatedProfit, setShowCreatedProfit] = useState(false)
  const [editingOrder, setEditingOrder]   = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget]       = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading]     = useState(false)
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen]   = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [search, setSearch]                   = useState('')
  const [apiSearch, setApiSearch]             = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [page, setPage]                   = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const clearSelection = () => setSelectedIds(new Set())

  // Debounce search input → reset to page 1 on change
  useEffect(() => {
    const t = setTimeout(() => { setApiSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (apiSearch)    params.set('search', apiSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom)     params.set('from',   dateFrom)
      if (dateTo)       params.set('to',     dateTo)
      params.set('page',  page.toString())
      params.set('limit', PAGE_SIZE.toString())

      const res  = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      if (data.stats) setServerStats(data.stats)
    } catch {
      toast.error('Không thể tải đơn hàng')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [apiSearch, statusFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const unpaidCount = serverStats.unpaid

  const stats = useMemo(() => [
    { label: 'Tổng cộng',       value: serverStats.total,  color: 'text-foreground', bar: 'bg-primary' },
    { label: 'Chưa thanh toán', value: serverStats.unpaid, color: 'text-red-600 dark:text-red-400',         bar: 'bg-red-500 dark:bg-red-400' },
    { label: 'Đã thanh toán',   value: serverStats.paid,   color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400' },
  ], [serverStats])

  const handleCreateSuccess = (order: Order) => { setCreatedOrder(order); setShowCreatedProfit(false); setCreateModal('success'); fetchOrders(true) }

  const handleEditSaved = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
    setEditingOrder(null)
    toast.success('Đã cập nhật đơn hàng')
    fetchOrders(true)
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
      fetchOrders(true)
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
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteTarget._id); return n })
      setDeleteTarget(null)
      toast.success('Đã xóa đơn hàng', { id: tid })

      const newTotalPages = Math.max(1, Math.ceil((total - 1) / PAGE_SIZE))
      if (page > newTotalPages) setPage(newTotalPages) // effect refetches
      else await fetchOrders(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', { id: tid })
    } finally {
      setDeleteLoading(false)
    }
  }

  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true)
    const count = selectedIds.size
    const tid = toast.loading(`Đang xóa ${count} đơn hàng…`)
    try {
      await Promise.all(
        [...selectedIds].map((id) => fetch(`/api/orders/${id}`, { method: 'DELETE' }))
      )
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      toast.success(`Đã xóa ${count} đơn hàng`, { id: tid })

      const newTotalPages = Math.max(1, Math.ceil((total - count) / PAGE_SIZE))
      if (page > newTotalPages) setPage(newTotalPages) // effect refetches
      else await fetchOrders(true)
    } catch {
      toast.error('Xóa thất bại', { id: tid })
    } finally {
      setBulkDeleteLoading(false)
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
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {loading && serverStats.total === 0
          ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
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
      <div className="mb-4 space-y-2">
        {/* Row 1: Search + Status */}
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên KH, SĐT, mã đơn, tên sản phẩm…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ''); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44">
              <ListOrdered className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Trạng thái thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusOrdersVN[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Date range + quick filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <DateInput
              value={dateFrom}
              onChange={(v) => { setDateFrom(v); setPage(1) }}
              placeholder="Từ ngày"
              className="w-32 sm:w-36"
            />
            <span className="text-muted-foreground text-xs shrink-0">—</span>
            <DateInput
              value={dateTo}
              onChange={(v) => { setDateTo(v); setPage(1) }}
              placeholder="Đến ngày"
              className="w-32 sm:w-36"
            />
          </div>

          {(() => {
            const t = todayISO()
            const isToday = dateFrom === t && dateTo === t
            return (
              <Button
                variant={isToday ? 'default' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => {
                  const t2 = todayISO()
                  if (isToday) { setDateFrom(''); setDateTo('') }
                  else { setDateFrom(t2); setDateTo(t2) }
                  setPage(1)
                }}
              >
                Hôm nay
              </Button>
            )
          })()}

          {(search || statusFilter || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setSearch(''); setApiSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}>
              <XCircle className="h-4 w-4" /> Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {!loading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị {orders.length} trong {total} đơn hàng
            {total !== serverStats.total && ` (đã lọc từ ${serverStats.total})`}
          </p>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Đã chọn {selectedIds.size} đơn</span>
              <Button
                size="sm" variant="destructive"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Xóa {selectedIds.size} đơn
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Bỏ chọn
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <OrderList
        orders={orders}
        loading={loading}
        onEdit={setEditingOrder}
        onDelete={setDeleteTarget}
        onComplete={handleComplete}
        onRowClick={setSelectedOrder}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => { setPage(p); clearSelection() }}
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
                      <span className="flex flex-col">
                        <span><span className="font-semibold">{item.quantity}×</span> {item.name}</span>
                        <span className="text-xs text-muted-foreground/70">{formatVND(item.price)}/sản phẩm</span>
                      </span>
                      <span className="text-muted-foreground">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatVND(createdOrder.totalAmount)}</span>
              </div>
              {showCreatedProfit ? (
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg border',
                  createdOrder.profit > 0 && 'bg-emerald-500/10 border-emerald-500/30',
                  createdOrder.profit < 0 && 'bg-red-500/10 border-red-500/30',
                  createdOrder.profit === 0 && 'bg-muted/40',
                )}>
                  <span className="text-sm font-semibold">
                    {createdOrder.profit >= 0 ? 'Lãi' : 'Lỗ'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-base font-bold tabular-nums',
                      createdOrder.profit > 0 && 'text-emerald-600 dark:text-emerald-400',
                      createdOrder.profit < 0 && 'text-red-600 dark:text-red-400',
                    )}>
                      {formatProfit(createdOrder.profit)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreatedProfit(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Ẩn lãi/lỗ"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreatedProfit(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem lãi/lỗ
                </button>
              )}
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

      {/* ── Bulk Delete ── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !open && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedIds.size} đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả {selectedIds.size} đơn hàng đã chọn sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteOpen(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={bulkDeleteLoading} onClick={confirmBulkDelete}>
              {bulkDeleteLoading ? 'Đang xóa…' : `Xóa ${selectedIds.size} đơn`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Order Detail Modal ── */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </AppShell>
  )
}
