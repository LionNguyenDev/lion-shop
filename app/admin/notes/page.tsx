'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import OrderNoteForm from '@/components/OrderNoteForm'
import OrderNoteDetailModal from '@/components/OrderNoteDetailModal'
import { OrderNote } from '@/lib/types'
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

type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; note: OrderNote }

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function getDayKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getDayLabel(key: string): { full: string; weekday: string; relative: string | null } {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  let relative: string | null = null
  if (diffDays === 0) relative = 'Hôm nay'
  else if (diffDays === 1) relative = 'Hôm qua'
  else if (diffDays > 1 && diffDays < 7) relative = `${diffDays} ngày trước`

  return {
    full: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    weekday: DAY_LABELS[date.getDay()],
    relative,
  }
}

export default function OrderNotesPage() {
  const [notes, setNotes]                     = useState<OrderNote[]>([])
  const [loading, setLoading]                 = useState(true)
  const [formState, setFormState]             = useState<FormState>({ mode: 'closed' })
  const [deleteTarget, setDeleteTarget]       = useState<OrderNote | null>(null)
  const [deleteLoading, setDeleteLoading]     = useState(false)
  const [selectedNote, setSelectedNote]       = useState<OrderNote | null>(null)
  const [search, setSearch]                   = useState('')
  const [collapsed, setCollapsed]             = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res  = await fetch('/api/order-notes')
        const data = await res.json()
        setNotes(data)
        setCollapsed(new Set((data as OrderNote[]).map((n) => getDayKey(n.createdAt))))
      } catch {
        toast.error('Không thể tải note đơn hàng')
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return notes
    return notes.filter(
      (n) =>
        n.orderCode.toLowerCase().includes(q) ||
        n.products.some((p) => p.name.toLowerCase().includes(q)) ||
        n.note.toLowerCase().includes(q),
    )
  }, [notes, search])

  /* ── Group by day ── */
  const grouped = useMemo(() => {
    const map = new Map<string, OrderNote[]>()
    for (const n of filtered) {
      const key = getDayKey(n.createdAt)
      const list = map.get(key) ?? []
      list.push(n)
      map.set(key, list)
    }
    // notes already sorted by createdAt desc from API
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1))
  }, [filtered])

  const toggleDay = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  /* ── Stats ── */
  const todayKey = getDayKey(new Date().toISOString())
  const stats = useMemo(() => [
    { label: 'Tổng note',   value: notes.length, color: 'text-foreground', bar: 'bg-primary' },
    { label: 'Hôm nay',     value: notes.filter((n) => getDayKey(n.createdAt) === todayKey).length, color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500 dark:bg-amber-400' },
    { label: 'Số ngày',     value: grouped.length, color: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500 dark:bg-blue-400' },
  ], [notes, grouped.length, todayKey])

  /* ── Actions ── */
  const handleCreated = (note: OrderNote) => {
    setNotes((prev) => [note, ...prev])
    setFormState({ mode: 'closed' })
    toast.success('Đã tạo note')
  }

  const handleUpdated = (updated: OrderNote) => {
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)))
    setFormState({ mode: 'closed' })
    toast.success('Đã cập nhật note')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const tid = toast.loading('Đang xóa note…')
    try {
      const res = await fetch(`/api/order-notes/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Xóa note thất bại')
      }
      setNotes((prev) => prev.filter((n) => n._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Đã xóa note', { id: tid })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại', { id: tid })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AppShell title="Note đơn hàng" description="Ghi chú và theo dõi thông tin đơn hàng">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Danh sách note</h2>
          <p className="text-sm text-muted-foreground">Tổ chức theo từng ngày, nhấp để mở rộng</p>
        </div>
        <Button onClick={() => setFormState({ mode: 'create' })}>
          <Plus /> Tạo note mới
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
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

      {/* Search */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn, sản phẩm, nội dung note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <XCircle className="h-4 w-4" /> Xóa
          </Button>
        )}
      </div>

      {/* Day-grouped collapsible sections */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <StickyNote className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Không có note nào khớp tìm kiếm.' : 'Chưa có note nào. Tạo note đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(([dayKey, dayNotes]) => {
            const isCollapsed = collapsed.has(dayKey)
            const label       = getDayLabel(dayKey)
            return (
              <div key={dayKey} className="rounded-xl border bg-card overflow-hidden">
                {/* Day section header */}
                <button
                  type="button"
                  onClick={() => toggleDay(dayKey)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{label.weekday}</span>
                      <span className="text-xs text-muted-foreground">{label.full}</span>
                      {label.relative && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {label.relative}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-semibold tabular-nums">
                    {dayNotes.length}
                  </Badge>
                </button>

                {/* Day notes */}
                {!isCollapsed && (
                  <ul className="divide-y border-t">
                    {dayNotes.map((n) => {
                      const time = new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      const totalQty = n.products.reduce((s, p) => s + p.quantity, 0)
                      return (
                        <li
                          key={n._id}
                          onClick={() => setSelectedNote(n)}
                          className="group flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          {/* Time */}
                          <div className="w-12 shrink-0 pt-1">
                            <p className="text-xs font-mono text-muted-foreground tabular-nums">{time}</p>
                          </div>

                          {/* Content — products are the visual anchor */}
                          <div className="flex-1 min-w-0">
                            {/* Big product names */}
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              {n.products.map((p, idx) => (
                                <span key={idx} className="text-base font-semibold leading-tight">
                                  {p.name}
                                  <span className="ml-1 text-xs font-mono font-semibold text-muted-foreground tabular-nums">
                                    ×{p.quantity}
                                  </span>
                                  {idx < n.products.length - 1 && (
                                    <span className="ml-2 text-muted-foreground/40">·</span>
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Subtle meta row */}
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono font-semibold">#{n.orderCode}</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="tabular-nums">{totalQty} cái</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="truncate flex-1">{n.note}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => { e.stopPropagation(); setFormState({ mode: 'edit', note: n }) }}
                              title="Sửa"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(n) }}
                              title="Xóa"
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={formState.mode !== 'closed'}
        onOpenChange={(open) => !open && setFormState({ mode: 'closed' })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formState.mode === 'edit' ? 'Chỉnh sửa note' : 'Tạo note mới'}
            </DialogTitle>
          </DialogHeader>
          <OrderNoteForm
            note={formState.mode === 'edit' ? formState.note : null}
            onSuccess={formState.mode === 'edit' ? handleUpdated : handleCreated}
            onCancel={() => setFormState({ mode: 'closed' })}
          />
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <OrderNoteDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa note?</AlertDialogTitle>
            <AlertDialogDescription>
              Note cho đơn{' '}
              <span className="font-mono font-semibold text-foreground">#{deleteTarget?.orderCode}</span> sẽ bị xóa vĩnh viễn.
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
    </AppShell>
  )
}
