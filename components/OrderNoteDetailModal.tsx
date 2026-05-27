'use client'

import { Hash, Package, StickyNote, Clock } from 'lucide-react'
import { OrderNote } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderNoteDetailModalProps {
  note: OrderNote | null
  onClose: () => void
}

export default function OrderNoteDetailModal({ note, onClose }: OrderNoteDetailModalProps) {
  if (!note) return null

  const totalQty = note.products.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <Dialog open={!!note} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-md max-h-[90dvh]">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold leading-tight">
            Chi tiết note{' '}
            <span className="font-mono text-muted-foreground">#{note._id.slice(-8).toUpperCase()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                <Hash className="w-3 h-3" /> Mã đơn
              </p>
              <p className="font-mono text-sm font-semibold">{note.orderCode}</p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                <Clock className="w-3 h-3" /> Thời gian
              </p>
              <p className="text-sm font-medium">{new Date(note.createdAt).toLocaleString('vi-VN')}</p>
            </div>
          </div>

          {/* Products list */}
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Package className="w-3 h-3" /> Sản phẩm
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {note.products.length} loại · {totalQty} cái
              </p>
            </div>
            <ul className="divide-y">
              {note.products.map((p, idx) => (
                <li key={idx} className="flex items-center justify-between px-3 py-2">
                  <span className="text-base font-semibold truncate flex-1 min-w-0">{p.name}</span>
                  <span className="ml-3 text-sm font-mono font-semibold tabular-nums text-muted-foreground shrink-0">
                    ×{p.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5">
              <StickyNote className="w-3 h-3" /> Note
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.note}</p>
          </div>
        </div>

        <div className="px-5 py-3 border-t shrink-0 flex justify-end">
          <Button size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
