'use client'

import { CheckCheck, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { formatProfit, formatVND, trashDaysLeft } from '@/lib/format'
import { Order, statusOrders, statusOrdersVN, TRASH_RETENTION_DAYS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface OrderListProps {
  orders: Order[]
  loading: boolean
  onEdit?: (order: Order) => void
  onDelete?: (order: Order) => void
  onComplete?: (order: Order) => void
  onRowClick?: (order: Order) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  /** 'trash' đổi cột trạng thái thành đếm ngược ngày và đổi bộ nút thao tác. */
  mode?: 'active' | 'trash'
  onRestore?: (order: Order) => void
  onPurge?: (order: Order) => void
}

const statusConfig: Record<string, { dot: string; badge: string }> = {
  [statusOrders.UNPAID]: { dot: 'bg-red-500',     badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30' },
  [statusOrders.PAID]:   { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' },
}

function Initials({ name }: { name?: string }) {
  const safe    = name?.trim() ?? ''
  const parts   = safe.split(' ')
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase">
      {letters || '?'}
    </div>
  )
}

export default function OrderList({
  orders,
  loading,
  onEdit,
  onDelete,
  onComplete,
  onRowClick,
  selectedIds = new Set(),
  onSelectionChange,
  mode = 'active',
  onRestore,
  onPurge,
}: OrderListProps) {
  const isTrash = mode === 'trash'
  const selectable = !isTrash && !!onSelectionChange
  const columnCount = selectable ? 7 : 6
  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o._id))
  const someSelected = orders.some((o) => selectedIds.has(o._id))

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      const next = new Set(selectedIds)
      orders.forEach((o) => next.delete(o._id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      orders.forEach((o) => next.add(o._id))
      onSelectionChange(next)
    }
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  if (loading)
    return (
      <div className="space-y-2 rounded-xl border bg-card p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    )

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {selectable && (
              <TableHead className="pl-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                />
              </TableHead>
            )}
            <TableHead className={cn('w-72', !selectable && 'pl-4')}>Tên sản phẩm</TableHead>
            <TableHead className="w-48">Khách hàng</TableHead>
            <TableHead className="w-40">Mã đơn hàng</TableHead>
            <TableHead className="w-48">Số tiền</TableHead>
            <TableHead className="w-36">{isTrash ? 'Đã xóa' : 'Trạng thái'}</TableHead>
            <TableHead className="text-center pr-5 w-32">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isPaid   = order.status === statusOrders.PAID
            const isChecked = selectedIds.has(order._id)
            // Đơn từng bị xóa rồi khôi phục — tô nền xanh lá nhạt để dễ nhận ra
            const isRestored = !isTrash && !!order.restoredAt
            const cfg      = statusConfig[order.status] ?? { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' }

            return (
              <TableRow
                key={order._id}
                className={cn(
                  'group',
                  onRowClick && 'cursor-pointer transition-colors',
                  onRowClick && (isRestored ? 'hover:bg-emerald-500/20' : 'hover:bg-muted/50'),
                  isRestored && 'bg-emerald-500/10',
                  isChecked && 'bg-muted/40',
                )}
                onClick={() => onRowClick?.(order)}
              >
                {/* Checkbox */}
                {selectable && (
                  <TableCell className="pl-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(order._id)}
                      className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                    />
                  </TableCell>
                )}

                {/* Sản phẩm */}
                <TableCell className={cn('py-3', !selectable && 'pl-4')}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 space-y-0.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm leading-snug">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground"> x{item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </TableCell>

                {/* Khách hàng */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Initials name={order.name?.trim() || 'Khách lẻ'} />
                    <div className="min-w-0">
                      <p className={cn(
                        'truncate text-sm font-semibold max-w-32',
                        !order.name?.trim() && 'italic text-muted-foreground',
                      )}>
                        {order.name?.trim() || 'Khách lẻ'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-32">{order.phone}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Mã đơn hàng */}
                <TableCell className="py-3">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{order._id.slice(-10).toUpperCase()}
                  </p>
                </TableCell>

                {/* Số tiền */}
                <TableCell className="py-3">
                  <p className="text-sm font-bold tabular-nums">{formatVND(order.totalAmount)}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    Vốn: {formatVND(order.totalAmount - order.profit)}
                  </p>
                  <p className={cn(
                    'text-[11px] font-semibold tabular-nums',
                    order.profit > 0 && 'text-emerald-600 dark:text-emerald-400',
                    order.profit < 0 && 'text-red-500 dark:text-red-400',
                    order.profit === 0 && 'text-muted-foreground',
                  )}>
                    {order.profit >= 0 ? 'Lãi' : 'Lỗ'}: {formatProfit(order.profit)}
                  </p>
                </TableCell>

                {/* Trạng thái · hoặc đếm ngược xóa vĩnh viễn khi ở thùng rác */}
                <TableCell className="py-3">
                  {isTrash ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {order.deletedAt ? new Date(order.deletedAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                      {order.deletedAt && (() => {
                        const daysLeft = trashDaysLeft(order.deletedAt, TRASH_RETENTION_DAYS)
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-medium',
                              daysLeft <= 2
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
                            )}
                          >
                            {daysLeft === 0 ? 'Sắp bị xóa' : `Còn ${daysLeft} ngày`}
                          </Badge>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.badge)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
                        {statusOrdersVN[order.status] || order.status}
                      </Badge>
                      {isRestored && (
                        <Badge
                          variant="outline"
                          title={`Khôi phục từ thùng rác lúc ${new Date(order.restoredAt as string).toLocaleString('vi-VN')}`}
                          className="gap-1 font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30"
                        >
                          <RotateCcw className="h-3 w-3" /> Đã khôi phục
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Thao tác */}
                <TableCell className="pr-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    {isTrash ? (
                      <>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => onRestore?.(order)}
                          className="h-7 px-2 text-xs"
                        >
                          <RotateCcw className="h-3 w-3" /> Khôi phục
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm"
                          onClick={() => onPurge?.(order)}
                          title="Xóa vĩnh viễn"
                          className="hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => onEdit?.(order)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil className="h-3 w-3" /> Sửa
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm"
                          disabled={isPaid}
                          onClick={() => onComplete?.(order)}
                          title="Đánh dấu hoàn thành"
                          className="hover:text-green-600 hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                        >
                          <CheckCheck />
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm"
                          onClick={() => onDelete?.(order)}
                          title="Xóa"
                          className="hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}

          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-16 text-center text-muted-foreground">
                {isTrash ? 'Thùng rác trống.' : 'Không tìm thấy đơn hàng.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
