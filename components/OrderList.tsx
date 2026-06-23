'use client'

import { CheckCheck, Pencil, Package, Trash2 } from 'lucide-react'
import { formatProfit, formatVND } from '@/lib/format'
import { Order, statusOrders, statusOrdersVN } from '@/lib/types'
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
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
  onComplete: (order: Order) => void
  onRowClick?: (order: Order) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
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
}: OrderListProps) {
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
            <TableHead className="pl-4 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
              />
            </TableHead>
            <TableHead className="w-72">Tên sản phẩm</TableHead>
            <TableHead className="w-48">Khách hàng</TableHead>
            <TableHead className="w-40">Mã đơn hàng</TableHead>
            <TableHead className="w-48">Số tiền</TableHead>
            <TableHead className="w-36">Trạng thái</TableHead>
            <TableHead className="text-center pr-5 w-32">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isPaid   = order.status === statusOrders.PAID
            const isChecked = selectedIds.has(order._id)
            const cfg      = statusConfig[order.status] ?? { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' }

            return (
              <TableRow
                key={order._id}
                className={cn('group', onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors', isChecked && 'bg-muted/40')}
                onClick={() => onRowClick?.(order)}
              >
                {/* Checkbox */}
                <TableCell className="pl-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(order._id)}
                    className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                  />
                </TableCell>

                {/* Sản phẩm */}
                <TableCell className="py-3">
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

                {/* Trạng thái */}
                <TableCell className="py-3">
                  <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.badge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
                    {statusOrdersVN[order.status] || order.status}
                  </Badge>
                </TableCell>

                {/* Thao tác */}
                <TableCell className="pr-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => onEdit(order)}
                      className="h-7 px-2 text-xs"
                    >
                      <Pencil className="h-3 w-3" /> Sửa
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      disabled={isPaid}
                      onClick={() => onComplete(order)}
                      title="Đánh dấu hoàn thành"
                      className="hover:text-green-600 hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                    >
                      <CheckCheck />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => onDelete(order)}
                      title="Xóa"
                      className="hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}

          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                Không tìm thấy đơn hàng.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
