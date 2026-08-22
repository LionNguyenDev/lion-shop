'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, RotateCcw, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import OrderList from '@/components/OrderList'
import OrderDetailModal from '@/components/OrderDetailModal'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Order,
  StockAdjustment,
  StockShortage,
  TRASH_RETENTION_DAYS,
  WAREHOUSES,
} from '@/lib/types'

const PAGE_SIZE = 10

export default function OrdersTrashPage() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [total, setTotal]         = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [apiSearch, setApiSearch] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Order | null>(null)
  const [restoringId, setRestoringId]     = useState<string | null>(null)

  // Đơn đang chờ xác nhận nhập bù kho, kèm chi tiết thiếu hàng từ server (409)
  const [shortageTarget, setShortageTarget] = useState<Order | null>(null)
  const [shortages, setShortages]           = useState<StockShortage[]>([])

  const [purgeTarget, setPurgeTarget]   = useState<Order | null>(null)
  const [purgeLoading, setPurgeLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setApiSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchTrash = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({ deleted: '1', page: String(page), limit: String(PAGE_SIZE) })
      if (apiSearch) params.set('search', apiSearch)

      const res  = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Không thể tải thùng rác')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [apiSearch, page])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  /** Lùi về trang trước nếu vừa xóa hết đơn cuối của trang hiện tại. */
  const refetchAfterRemoval = async () => {
    const newTotalPages = Math.max(1, Math.ceil((total - 1) / PAGE_SIZE))
    if (page > newTotalPages) setPage(newTotalPages) // effect tự refetch
    else await fetchTrash(true)
  }

  const restore = async (order: Order, force = false) => {
    setRestoringId(order._id)
    const tid = toast.loading(force ? 'Đang nhập bù kho và khôi phục…' : 'Đang khôi phục đơn hàng…')
    try {
      const res = await fetch(`/api/orders/${order._id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()

      // Kho không đủ → thay dialog xác nhận bằng dialog nhập bù, không báo lỗi suông
      if (res.status === 409 && data.error === 'INSUFFICIENT_STOCK') {
        toast.dismiss(tid)
        setRestoreTarget(null)
        setShortages(data.shortages ?? [])
        setShortageTarget(order)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Khôi phục đơn hàng thất bại')

      const adjustments = (data.adjustments ?? []) as StockAdjustment[]
      toast.success(
        adjustments.length > 0
          ? `Đã nhập bù ${adjustments.map((a) => `${a.added} ${a.name} (${WAREHOUSES[a.warehouse]})`).join(', ')} và khôi phục đơn hàng`
          : 'Đã khôi phục đơn hàng',
        { id: tid },
      )

      setRestoreTarget(null)
      setShortageTarget(null)
      setShortages([])
      await refetchAfterRemoval()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Khôi phục thất bại', { id: tid })
    } finally {
      setRestoringId(null)
    }
  }

  const confirmPurge = async () => {
    if (!purgeTarget) return
    setPurgeLoading(true)
    const tid = toast.loading('Đang xóa vĩnh viễn…')
    try {
      const res = await fetch(`/api/orders/${purgeTarget._id}?permanent=1`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Xóa vĩnh viễn thất bại')
      }
      setPurgeTarget(null)
      toast.success('Đã xóa vĩnh viễn đơn hàng', { id: tid })
      await refetchAfterRemoval()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', { id: tid })
    } finally {
      setPurgeLoading(false)
    }
  }

  return (
    <AppShell title="Thùng rác" description={`Đơn hàng đã xóa, tự động xóa vĩnh viễn sau ${TRASH_RETENTION_DAYS} ngày`}>
      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Đơn hàng đã xóa</h2>
          <p className="text-sm text-muted-foreground">
            Đơn nằm ở đây {TRASH_RETENTION_DAYS} ngày rồi bị xóa vĩnh viễn. Số lượng sản phẩm đã được hoàn lại kho khi xóa.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/admin/orders" />}>
          <ArrowLeft /> Danh sách đơn hàng
        </Button>
      </div>

      {/* ── Search ── */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên KH, SĐT, mã đơn, tên sản phẩm…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Hiển thị {orders.length} trong {total} đơn đã xóa
        </p>
      )}

      <OrderList
        orders={orders}
        loading={loading}
        mode="trash"
        onRowClick={setSelectedOrder}
        onRestore={setRestoreTarget}
        onPurge={setPurgeTarget}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />

      {/* ── Xác nhận khôi phục ── */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn hàng{' '}
              <span className="font-mono font-semibold text-foreground">
                #{restoreTarget?._id.slice(-8).toUpperCase()}
              </span>{' '}
              của <span className="font-medium text-foreground">{restoreTarget?.name?.trim() || 'Khách lẻ'}</span>{' '}
              sẽ trở lại danh sách đơn hàng, và số lượng sau đây sẽ{' '}
              <span className="font-medium text-foreground">bị trừ lại khỏi kho</span>:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="divide-y rounded-lg border overflow-hidden text-sm">
            {restoreTarget?.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 bg-card">
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{item.quantity}×</span> {item.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  Kho {WAREHOUSES[item.warehouse ?? restoreTarget.warehouse]}
                </span>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!restoringId}
              onClick={() => restoreTarget && restore(restoreTarget)}
            >
              <RotateCcw /> {restoringId ? 'Đang khôi phục…' : 'Khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Không đủ hàng để khôi phục ── */}
      <AlertDialog
        open={!!shortageTarget}
        onOpenChange={(open) => { if (!open) { setShortageTarget(null); setShortages([]) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Không đủ hàng để khôi phục đơn</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn hàng{' '}
              <span className="font-mono font-semibold text-foreground">
                #{shortageTarget?._id.slice(-8).toUpperCase()}
              </span>{' '}
              cần nhiều hơn số lượng đang có trong kho:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="divide-y rounded-lg border overflow-hidden text-sm">
            {shortages.map((s) => (
              <div key={`${s.productId}:${s.warehouse}`} className="flex items-center justify-between gap-3 px-3 py-2 bg-card">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Kho {WAREHOUSES[s.warehouse]}</p>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <p className="text-xs text-muted-foreground">Còn {s.available} · cần {s.required}</p>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">Thiếu {s.missing}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Nếu tiếp tục, hệ thống sẽ <span className="font-medium text-foreground">cộng thêm phần còn thiếu vào kho</span> rồi
            khôi phục đơn. Chỉ làm việc này nếu hàng thực tế có trong kho — số lượng bù được tính lại tại thời điểm bấm nút.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShortageTarget(null); setShortages([]) }}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!!restoringId}
              onClick={() => shortageTarget && restore(shortageTarget, true)}
            >
              {restoringId ? 'Đang xử lý…' : 'Nhập bù kho & khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Xóa vĩnh viễn ── */}
      <AlertDialog open={!!purgeTarget} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn hàng{' '}
              <span className="font-mono font-semibold text-foreground">
                #{purgeTarget?._id.slice(-8).toUpperCase()}
              </span>{' '}
              sẽ bị xóa khỏi hệ thống và <span className="font-medium text-foreground">không thể khôi phục</span>.
              Tồn kho không thay đổi vì đã được hoàn lại khi xóa đơn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPurgeTarget(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={purgeLoading} onClick={confirmPurge}>
              <Trash2 /> {purgeLoading ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </AppShell>
  )
}
