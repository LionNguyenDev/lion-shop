'use client'

import { CheckCheck, Pencil, Package, Trash2 } from 'lucide-react'
import { formatVND } from '@/lib/format'
import { Order, statusOrders } from '@/lib/types'
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
}

const statusConfig: Record<string, { dot: string; badge: string }> = {
  [statusOrders.UNPAID]:     { dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30' },
  [statusOrders.PAID]:       { dot: 'bg-emerald-500',badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' },
  [statusOrders.PROCESSING]: { dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30' },
  [statusOrders.PENDING]:    { dot: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30' },
  [statusOrders.SHIPPED]:    { dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30' },
  [statusOrders.DELIVERED]:  { dot: 'bg-teal-500',   badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 dark:border-teal-500/30' },
  [statusOrders.COMPLETED]:  { dot: 'bg-zinc-400',   badge: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 dark:border-zinc-500/30' },
  [statusOrders.CANCELLED]:  { dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30' },
  [statusOrders.RETURNED]:   { dot: 'bg-pink-500',   badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 dark:border-pink-500/30' },
  [statusOrders.FAILED]:     { dot: 'bg-red-700',    badge: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30 dark:border-red-500/40' },
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
}: OrderListProps) {
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
            <TableHead className="pl-5 w-64">Tên sản phẩm</TableHead>
            <TableHead className="w-48">Khách hàng</TableHead>
            <TableHead className="w-40">Mã đơn hàng</TableHead>
            <TableHead className="w-36">Số tiền</TableHead>
            <TableHead className="w-36">Trạng thái</TableHead>
            <TableHead className="text-center pr-5 w-32">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isCompleted = order.status === statusOrders.COMPLETED
            const cfg         = statusConfig[order.status] ?? { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' }
            const firstItem   = order.items[0]
            const extraItems  = order.items.length - 1

            return (
              <TableRow key={order._id} className="group">
                {/* Sản phẩm */}
                <TableCell className="pl-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                      <Package className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold max-w-44">
                        {firstItem?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {extraItems > 0
                          ? `+${extraItems} sản phẩm khác`
                          : `${firstItem?.quantity ?? 1} cái`}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Khách hàng */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Initials name={order.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold max-w-32">{order.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-32">{order.phone}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Mã đơn hàng */}
                <TableCell className="py-3">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    #{order._id.slice(-10).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </TableCell>

                {/* Số tiền */}
                <TableCell className="py-3">
                  <p className="text-sm font-bold">{formatVND(order.totalAmount)}</p>
                </TableCell>

                {/* Trạng thái */}
                <TableCell className="py-3">
                  <Badge variant="outline" className={cn('gap-1.5 font-medium', cfg.badge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
                    {order.status}
                  </Badge>
                </TableCell>

                {/* Thao tác */}
                <TableCell className="pr-5 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      disabled={isCompleted}
                      onClick={() => onEdit(order)}
                      className="h-7 px-2 text-xs"
                    >
                      <Pencil className="h-3 w-3" /> Sửa
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      disabled={isCompleted}
                      onClick={() => onComplete(order)}
                      title="Đánh dấu hoàn thành"
                      className="hover:text-green-600 hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                    >
                      <CheckCheck />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      disabled={isCompleted}
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
