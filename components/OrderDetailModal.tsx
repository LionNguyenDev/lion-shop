'use client'

import { formatVND, formatProfit } from '@/lib/format'
import { Order, statusOrdersVN } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

const statusBadgeClass: Record<string, string> = {
  'Paid':   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
  'Unpaid': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30',
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      {/* flex-col + p-0 để tự kiểm soát padding; max-h dvh để scroll chỉ khi màn hình quá bé */}
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-lg max-h-[90dvh]">

        {/* ── Header cố định ── */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold leading-tight">
            Chi tiết đơn hàng{' '}
            <span className="font-mono text-muted-foreground">
              #{order._id.slice(-10).toUpperCase()}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ── Body (scroll chỉ khi cần) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2.5">

          {/* Trạng thái + Ngày tạo */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn('text-xs font-bold', statusBadgeClass[order.status] ?? 'bg-slate-100 text-slate-600')}
            >
              {statusOrdersVN[order.status] || order.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Thông tin khách hàng – 2 cột */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/30 border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Khách hàng
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 px-3 py-2.5 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Tên</p>
                <p className="font-medium">{order.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Điện thoại</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Địa chỉ</p>
                <p className="font-medium">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Sản phẩm – compact table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/30 border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sản phẩm
              </p>
            </div>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-sm',
                  idx !== order.items.length - 1 && 'border-b'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ×{item.quantity} · {formatVND(item.price)}/cái
                  </p>
                </div>
                <div className="ml-4 text-right shrink-0">
                  <p className="font-semibold">{formatVND(item.price * item.quantity)}</p>
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <p className="text-[11px] text-muted-foreground line-through">
                      {formatVND(item.originalPrice * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tóm tắt tài chính */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border text-sm">
              <span className="text-muted-foreground">Tổng tiền hàng</span>
              <span className="font-semibold">{formatVND(order.totalAmount)}</span>
            </div>
            <div className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
              order.profit > 0 && 'bg-emerald-500/10 border-emerald-500/30',
              order.profit < 0 && 'bg-red-500/10 border-red-500/30',
              order.profit === 0 && 'bg-muted/40 border-transparent',
            )}>
              <span className="font-semibold">{order.profit >= 0 ? 'Lãi' : 'Lỗ'}</span>
              <span className={cn(
                'font-bold tabular-nums',
                order.profit > 0 && 'text-emerald-600 dark:text-emerald-400',
                order.profit < 0 && 'text-red-600 dark:text-red-400',
              )}>
                {formatProfit(order.profit)}
              </span>
            </div>
          </div>

        </div>

        {/* ── Footer cố định ── */}
        <div className="px-5 py-3 border-t shrink-0 flex justify-end">
          <Button size="sm" onClick={onClose}>Đóng</Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
