'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { CalendarDays, CheckCircle, ListOrdered, Plus, Search, SlidersHorizontal, Trash2, XCircle } from 'lucide-react'
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

export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [loading, setLoading]             = useState(true)
  const [refreshKey, setRefreshKey]       = useState(0)
  const [createModal, setCreateModal]     = useState<CreateModal>('closed')
  const [createdOrder, setCreatedOrder]   = useState<Order | null>(null)
  const [editingOrder, setEditingOrder]   = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget]       = useState<Order | null>(null)
  const [deleteLoading, setDeleteLoading]     = useState(false)
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen]   = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [search, setSearch]                   = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [page, setPage]                   = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setOrders(data) })
      .catch(() => { if (!cancelled) toast.error('Không thể tải đơn hàng') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  const unpaidCount = useMemo(
    () => orders.filter((o) => o.status === statusOrders.UNPAID).length,
    [orders],
  )

  const stats = useMemo(() => [
    { label: 'Tổng cộng',       value: orders.length, color: 'text-foreground', bar: 'bg-primary' },
    { label: 'Chưa thanh toán', value: orders.filter((o) => o.status === statusOrders.UNPAID).length, color: 'text-red-600 dark:text-red-400', bar: 'bg-red-500 dark:bg-red-400' },
    { label: 'Đã thanh toán',   value: orders.filter((o) => o.status === statusOrders.PAID).length,   color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500 dark:bg-emerald-400' },
  ], [orders])

  const filteredOrders = useMemo(() => {
    const q    = search.toLowerCase()
    const from = dateFrom ? new Date(dateFrom) : null
    const to   = dateTo   ? new Date(`${dateTo}T23:59:59`) : null
    return orders.filter((o) => {
      const matchSearch = !q || o.name?.toLowerCase().includes(q) || o._id.toLowerCase().includes(q) || o.phone?.includes(q) || o.items.some((it) => it.name.toLowerCase().includes(q))
      const matchStatus = !statusFilter || o.status === statusFilter
      const created     = new Date(o.createdAt)
      const matchFrom   = !from || created >= from
      const matchTo     = !to   || created <= to
      return matchSearch && matchStatus && matchFrom && matchTo
    })
  }, [orders, search, statusFilter, dateFrom, dateTo])

  const totalPages  = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCreateSuccess = (order: Order) => { setCreatedOrder(order); setCreateModal('success'); setRefreshKey((k) => k + 1) }

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

  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true)
    const tid = toast.loading(`Đang xóa ${selectedIds.size} đơn hàng…`)
    try {
      await Promise.all(
        [...selectedIds].map((id) => fetch(`/api/orders/${id}`, { method: 'DELETE' }))
      )
      setOrders((prev) => prev.filter((o) => !selectedIds.has(o._id)))
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      toast.success(`Đã xóa ${selectedIds.size} đơn hàng`, { id: tid })
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
        {loading
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
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên KH, SĐT, mã đơn, tên sản phẩm…"
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

        {/* Date range */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <DateInput
            value={dateFrom}
            onChange={(v) => { setDateFrom(v); setPage(1) }}
            className="w-36"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <DateInput
            value={dateTo}
            onChange={(v) => { setDateTo(v); setPage(1) }}
            className="w-36"
          />
        </div>

        {(() => {
          const t = todayISO()
          const isToday = dateFrom === t && dateTo === t
          return (
            <Button
              variant={isToday ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const t2 = todayISO()
                if (isToday) { setDateFrom(''); setDateTo('') }
                else { setDateFrom(t2); setDateTo(t2) }
                setPage(1)
              }}
            >
              Đơn hôm nay
            </Button>
          )
        })()}

        {(search || statusFilter || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1) }}>
            <XCircle className="h-4 w-4" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      {!loading && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Hiển thị {pagedOrders.length} trong {filteredOrders.length} đơn hàng
            {filteredOrders.length !== orders.length && ` (đã lọc từ ${orders.length})`}
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
        orders={pagedOrders}
        loading={loading}
        onEdit={setEditingOrder}
        onDelete={setDeleteTarget}
        onComplete={handleComplete}
        onRowClick={setSelectedOrder}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />

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
