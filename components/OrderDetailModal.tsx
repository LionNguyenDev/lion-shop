'use client'

import { useState } from 'react'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { formatVND, formatProfit } from '@/lib/format'
import { Order, statusOrdersVN } from '@/lib/types'
import { BADGE_SIZE, NUMERIC, RESTORED_BADGE, profitClass, statusBadgeClass } from '@/lib/orderStyles'
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

/** Từ ngần này sản phẩm trở lên thì danh sách trong modal chia làm 2 cột. */
const ITEMS_TWO_COLUMN_THRESHOLD = 10


export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [showProfit, setShowProfit] = useState(false)
  const [visibleOriginalPrices, setVisibleOriginalPrices] = useState<Set<number>>(new Set())

  const toggleOriginalPrice = (idx: number) => {
    setVisibleOriginalPrices((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  if (!order) return null

  // Đơn nhiều sản phẩm: chia đôi thành 2 cột thay vì một cột dài phải cuộn.
  // Chia theo cột (1..n/2 bên trái) để đọc dọc tự nhiên, không phải zigzag.
  const twoColumns = order.items.length > ITEMS_TWO_COLUMN_THRESHOLD
  const indexedItems = order.items.map((item, idx) => ({ item, idx }))
  const half = Math.ceil(indexedItems.length / 2)
  const itemColumns = twoColumns
    ? [indexedItems.slice(0, half), indexedItems.slice(half)]
    : [indexedItems]

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      {/* flex-col + p-0 để tự kiểm soát padding; max-h dvh để scroll chỉ khi màn hình quá bé */}
      <DialogContent className={cn(
        'flex flex-col gap-0 p-0 max-h-[90dvh]',
        twoColumns ? 'sm:max-w-3xl' : 'sm:max-w-lg',
      )}>

        {/* ── Header cố định ── */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold leading-tight">
            Chi tiết đơn hàng{' '}
            <span className={cn('text-muted-foreground', NUMERIC)}>
              #{order._id.slice(-10).toUpperCase()}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ── Body (scroll chỉ khi cần) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2.5">

          {/* Trạng thái + Ngày tạo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn(BADGE_SIZE, statusBadgeClass(order.status))}
              >
                {statusOrdersVN[order.status] || order.status}
              </Badge>
              {order.restoredAt && (
                <Badge
                  variant="outline"
                  title={`Khôi phục từ thùng rác lúc ${new Date(order.restoredAt).toLocaleString('vi-VN')}`}
                  className={cn('gap-1', BADGE_SIZE, RESTORED_BADGE)}
                >
                  <RotateCcw className="h-3 w-3" /> Đã khôi phục
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Thông tin khách hàng – 2 cột */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-1.5 bg-muted/30 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Khách hàng
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 px-3 py-2.5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">Tên</p>
                <p className={cn('font-medium', !order.name?.trim() && 'italic text-muted-foreground')}>
                  {order.name?.trim() || 'Khách lẻ'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">Điện thoại</p>
                <p className="font-medium">{order.phone?.trim() || '—'}</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-0.5">Địa chỉ</p>
                <p className="font-medium">{order.address?.trim() || '—'}</p>
              </div>
            </div>
          </div>

          {/* Sản phẩm – compact table (2 cột khi đơn có nhiều sản phẩm) */}
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sản phẩm
              </p>
              <p className={cn('text-xs font-semibold text-muted-foreground', NUMERIC)}>
                {order.items.length} loại
              </p>
            </div>
            {/* divide-* lo luôn đường kẻ nên không phải xử lý phần tử cuối;
                trên màn hình hẹp 2 cột tự xếp chồng lại thành 1 */}
            <div className={cn(
              twoColumns && 'grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0',
            )}>
              {itemColumns.map((column, columnIdx) => (
                <div key={columnIdx} className="divide-y">
                  {column.map(({ item, idx }) => {
                    const hasOriginal = !!item.originalPrice && item.originalPrice !== item.price
                    const isVisible   = visibleOriginalPrices.has(idx)
                    return (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className={cn('mt-0.5 text-xs text-muted-foreground', NUMERIC)}>
                            ×{item.quantity} · {formatVND(item.price)}/cái
                          </p>
                        </div>
                        <div className="ml-3 text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasOriginal && (
                              <button
                                type="button"
                                onClick={() => toggleOriginalPrice(idx)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={isVisible ? 'Ẩn giá gốc' : 'Xem giá gốc'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <p className={cn('font-semibold', NUMERIC)}>{formatVND(item.price * item.quantity)}</p>
                          </div>
                          {hasOriginal && isVisible && (
                            <p className={cn('text-xs text-muted-foreground line-through', NUMERIC)}>
                              {formatVND(item.originalPrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tóm tắt tài chính */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border text-sm">
              <span className="text-muted-foreground">Tổng tiền hàng</span>
              <span className={cn('font-semibold', NUMERIC)}>{formatVND(order.totalAmount)}</span>
            </div>
            {showProfit ? (
              <div className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg border text-sm',
                order.profit > 0 && 'bg-success/10 border-success/30',
                order.profit < 0 && 'bg-destructive/10 border-destructive/30',
                order.profit === 0 && 'bg-muted/40 border-transparent',
              )}>
                <span className="font-semibold">{order.profit >= 0 ? 'Lãi' : 'Lỗ'}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-bold', NUMERIC, profitClass(order.profit),
                  )}>
                    {formatProfit(order.profit)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProfit(false)}
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
                onClick={() => setShowProfit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Xem lãi/lỗ
              </button>
            )}
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
