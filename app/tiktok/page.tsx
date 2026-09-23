'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Loader2,
  LogOut,
  Play,
  RotateCcw,
  Square,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { ThemeToggleBtn } from '@/app/home/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { TIKTOK_CACHE_TTL, TIKTOK_MAX_LINKS, TIKTOK_MAX_SAVED_ROWS, TIKTOK_RESULTS_TTL } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const MAX_LINKS        = TIKTOK_MAX_LINKS
const REQUEST_DELAY_MS = 4000
/** Consecutive "TikTok is refusing us" errors before the run stops itself */
const MAX_BLOCKED_STREAK = 3

interface Stats {
  // Missing on tables saved before these were tracked
  title?: string
  description?: string
  followers?: number
  views: number
  likes: number
  comments: number
  favorites: number
  shares: number
  cached?: boolean
}

type RowStatus = 'pending' | 'loading' | 'done' | 'error'

interface ResultRow {
  url: string
  runAt: number // epoch ms of the run this row belongs to; rows are grouped by it
  status: RowStatus
  stats?: Stats
  error?: string
}

let lineSeq = 0
const newLine = (value = '') => ({ id: ++lineSeq, value })

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })

/** Wrapped so the React compiler doesn't see Date.now() called inside the component */
const nowMs = () => Date.now()

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

/** Position of each row inside its own run (1-based), so STT restarts for every run */
const numberWithinRuns = (rows: ResultRow[]) =>
  rows.map((r, i) => {
    let n = 1
    while (i - n >= 0 && rows[i - n].runAt === r.runAt) n++
    return n
  })

const fmt = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString('vi-VN'))

/** Descriptive columns shown between Link and the "Results" group */
const TEXT_FIELDS = [
  { label: 'Title',       key: 'title',       width: 30 },
  { label: 'Description', key: 'description', width: 60 },
] as const

const METRICS = [
  { label: 'Follower',           key: 'followers' },
  { label: 'View',               key: 'views' },
  { label: 'Like',               key: 'likes' },
  { label: 'CMT',                key: 'comments' },
  { label: 'Added to Favorites', key: 'favorites' },
  { label: 'Share',              key: 'shares' },
] as const

/**
 * Clipboard API only exists on https / localhost. On e.g. http://192.168… fall back to the
 * old execCommand path so copying still works there.
 */
async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  if (!ok) throw new Error('copy failed')
}

// Line breaks / tabs would make Excel split one value across several cells
const flatten = (v: string | number | undefined) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim()

type CopyableColumn = (typeof TEXT_FIELDS)[number] | (typeof METRICS)[number]

/** Copies one column as one value per line (raw numbers) so it pastes straight into Excel */
function CopyColumnButton({ rows, column }: { rows: ResultRow[]; column: CopyableColumn }) {
  const [copied, setCopied] = useState(false)
  const hasData = rows.some((r) => r.stats)

  const copy = async () => {
    // Rows without stats become blank lines so the pasted column stays aligned with the links
    const text = rows.map((r) => flatten(r.stats?.[column.key])).join('\n')
    try {
      await copyText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      toast.success(`Đã copy cột ${column.label}`)
    } catch {
      toast.error('Không copy được, trình duyệt chặn quyền clipboard')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={!hasData}
      onClick={copy}
      title={`Copy cột ${column.label}`}
      aria-label={`Copy cột ${column.label}`}
    >
      {copied ? <Check className="text-emerald-500" /> : <Copy />}
    </Button>
  )
}

async function exportXlsx(rows: ResultRow[]) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('TikTok')

  // STT, Link, Title, Description, then the "Results" group with one column per metric
  const firstMetricCol = 3 + TEXT_FIELDS.length
  const lastCol        = firstMetricCol + METRICS.length - 1
  ws.columns = [
    { width: 6 },
    { width: 60 },
    ...TEXT_FIELDS.map((f) => ({ width: f.width })),
    ...METRICS.map(() => ({ width: 12 })),
  ]

  // Two-row header: "Results" spans the metric columns, every other column spans both rows
  ws.getRow(1).values = ['STT', 'Link', ...TEXT_FIELDS.map((f) => f.label), 'Results']
  ws.getRow(2).values = [...Array(firstMetricCol - 1).fill(''), ...METRICS.map((m) => m.label)]
  for (let c = 1; c < firstMetricCol; c++) ws.mergeCells(1, c, 2, c)
  ws.mergeCells(1, firstMetricCol, 1, lastCol)
  ws.getRow(2).height = 32

  const stt       = numberWithinRuns(rows)
  const runStarts = new Set<number>() // sheet row numbers that begin a new run (except the first)
  rows.forEach((r, i) => {
    const s = r.stats
    const row = ws.addRow(
      s
        ? [stt[i], r.url, ...TEXT_FIELDS.map((f) => s[f.key] ?? ''), ...METRICS.map((m) => s[m.key] ?? '')]
        : [stt[i], r.url, ...TEXT_FIELDS.map(() => ''), `Lỗi: ${r.error ?? 'chưa chạy'}`],
    )
    if (i > 0 && r.runAt !== rows[i - 1].runAt) runStarts.add(row.number)
    row.getCell(2).value = { text: r.url, hyperlink: r.url }
    if (!s) ws.mergeCells(row.number, firstMetricCol, row.number, lastCol)
  })

  const border = { style: 'thin' as const }
  ws.eachRow((row, rowNumber) => {
    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c)
      // A thicker line separates runs, matching the dividers in the on-screen table
      const top = runStarts.has(rowNumber) ? { style: 'medium' as const } : border
      cell.border = { top, left: border, bottom: border, right: border }
      if (rowNumber <= 2) {
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      } else if (c === 2) {
        cell.font = { color: { argb: 'FF0563C1' }, underline: true }
        cell.alignment = { vertical: 'top' }
      } else if (c < firstMetricCol) {
        // Title / Description: full text, wrapped
        cell.alignment = c === 1 ? { horizontal: 'center', vertical: 'top' } : { vertical: 'top', wrapText: true }
      } else {
        cell.numFmt = '#,##0'
        cell.alignment = { horizontal: 'center', vertical: 'top' }
      }
    }
  })

  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `tiktok-stats-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.xlsx`
  a.click()
  URL.revokeObjectURL(a.href)
}

function StatusIcon({ status }: { status: RowStatus }) {
  if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin text-primary" />
  if (status === 'done')    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === 'error')   return <XCircle className="h-4 w-4 text-destructive" />
  return <Clock className="h-4 w-4 text-muted-foreground/50" />
}

function TikTokShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setName(d.user?.name ?? null))
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    const tid = toast.loading('Đang đăng xuất…')
    await fetch('/api/auth/signout', { method: 'POST' })
    toast.success('Đã đăng xuất', { id: tid })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4 sm:px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none">TikTok Stats</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Lấy số view, like, comment, favorite, share của video TikTok
            </p>
          </div>
          {name && <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>}
          <ThemeToggleBtn />
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut /> <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}

export default function TikTokStatsPage() {
  const [lines, setLines]     = useState(() => [newLine()])
  const [results, setResults] = useState<ResultRow[]>([])
  const [running, setRunning] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  // "Xóa hết" deletes the saved copy but leaves the table on screen until reload.
  // Runs up to this runAt are display-only and never saved again (-1 = nothing cleared yet).
  const [clearedAt, setClearedAt] = useState(-1)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const inputRefs             = useRef(new Map<number, HTMLInputElement>())
  const abortRef              = useRef<AbortController | null>(null)
  const saveQueue             = useRef<Promise<void>>(Promise.resolve())

  /* ── Saved results (kept in the DB for TIKTOK_RESULTS_TTL) ── */
  useEffect(() => {
    fetch('/api/tiktok-results')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rows: ResultRow[]; expiresAt: string | null } | null) => {
        if (!data?.rows.length) return
        // Tables saved before runs were tracked have no runAt; treat them as one run
        setResults(data.rows.map((r) => ({ ...r, runAt: r.runAt ?? 0 })))
        setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null)
      })
      .catch(() => toast.error('Không tải được kết quả đã lưu'))
      .finally(() => setLoaded(true))
  }, [])

  // Saves are chained so a slow request can never overwrite a newer table
  const save = (all: ResultRow[]) => {
    const rows = all.filter((r) => r.runAt > clearedAt).slice(-TIKTOK_MAX_SAVED_ROWS)
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        // Nothing left to save → drop the saved copy, so deleted rows don't come back on reload
        const res = rows.length
          ? await fetch('/api/tiktok-results', {
              method:  'PUT',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ rows }),
            })
          : await fetch('/api/tiktok-results', { method: 'DELETE' })
        if (!res.ok) throw new Error()
        if (!rows.length) {
          setExpiresAt(null)
          return
        }
        const data = await res.json()
        setExpiresAt(new Date(data.expiresAt))
      } catch {
        toast.error('Không lưu được kết quả', { id: 'tiktok-save-failed' })
      }
    })
  }

  const filled = lines.filter((l) => l.value.trim()).length

  const focusLine = (id: number) => requestAnimationFrame(() => inputRefs.current.get(id)?.focus())

  /* ── Link input ── */
  const updateLine = (id: number, value: string) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, value } : l)))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const line = lines[index]
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!line.value.trim()) return
      if (lines.length >= MAX_LINKS) {
        toast.warning(`Tối đa ${MAX_LINKS} link mỗi lần chạy`)
        return
      }
      const next = newLine()
      setLines((prev) => [...prev.slice(0, index + 1), next, ...prev.slice(index + 1)])
      focusLine(next.id)
    } else if (e.key === 'Backspace' && !line.value && lines.length > 1) {
      e.preventDefault()
      setLines((prev) => prev.filter((l) => l.id !== line.id))
      focusLine(lines[index === 0 ? 1 : index - 1].id)
    } else if (e.key === 'ArrowUp' && index > 0) {
      focusLine(lines[index - 1].id)
    } else if (e.key === 'ArrowDown' && index < lines.length - 1) {
      focusLine(lines[index + 1].id)
    }
  }

  // Pasting several links at once splits them into separate lines
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const parts = e.clipboardData.getData('text').split(/[\s,]+/).map((s) => s.replace(/^-+/, '').trim()).filter(Boolean)
    if (parts.length <= 1) return
    e.preventDefault()

    const current = lines[index]
    const pasted  = parts.map((p, i) => (i === 0 && !current.value.trim() ? { ...current, value: p } : newLine(p)))
    let merged    = [...lines.slice(0, index + (current.value.trim() ? 1 : 0)), ...pasted, ...lines.slice(index + 1)]
    merged        = merged.filter((l, i) => l.value.trim() || i === merged.length - 1)

    if (merged.length > MAX_LINKS) {
      toast.warning(`Chỉ giữ ${MAX_LINKS} link đầu tiên`)
      merged = merged.slice(0, MAX_LINKS)
    }
    setLines(merged)
    focusLine(merged[merged.length - 1].id)
  }

  // Clears the link input and the saved copy; the results stay on screen until the page is reloaded
  const clearAll = () => {
    const first = newLine()
    setLines([first])
    setExpiresAt(null)
    setClearedAt(results.reduce((max, r) => Math.max(max, r.runAt), 0))
    focusLine(first.id)
    saveQueue.current = saveQueue.current.then(() =>
      fetch('/api/tiktok-results', { method: 'DELETE' })
        .then(() => undefined)
        .catch(() => { toast.error('Không xóa được kết quả đã lưu') }),
    )
  }

  /* ── Run ── */
  const run = async (rows: ResultRow[], onlyIndexes: number[]) => {
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)

    // The run owns the table while it's going; every change is mirrored to state
    let current = rows
    const update = (i: number, patch: Partial<ResultRow>) => {
      current = current.map((r, j) => (j === i ? { ...r, ...patch } : r))
      setResults(current)
    }
    setResults(current)
    save(current)

    let lastHitTikTok = false
    let blockedStreak = 0
    for (const i of onlyIndexes) {
      if (controller.signal.aborted) break
      // Only throttle when the previous request actually went to TikTok (cache hits are free)
      if (lastHitTikTok) await sleep(REQUEST_DELAY_MS, controller.signal)
      if (controller.signal.aborted) break

      update(i, { status: 'loading', error: undefined })
      let patch: Partial<ResultRow>
      try {
        const res = await fetch(`/api/tiktok-stats?url=${encodeURIComponent(rows[i].url)}`)
        if (res.redirected || res.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
          controller.abort()
          patch = { status: 'error', error: 'Chưa đăng nhập' }
        } else if (res.status === 403) {
          toast.error('Tài khoản chưa được cấp quyền dùng tính năng này')
          controller.abort()
          patch = { status: 'error', error: 'Không có quyền' }
        } else {
          const data = await res.json()
          patch = res.ok ? { status: 'done', stats: data } : { status: 'error', error: data.error }
          lastHitTikTok = !(res.ok && data.cached)
          // Link-specific errors (deleted video, bad link) neither count nor reset the streak
          if (res.ok) blockedStreak = 0
          else if (data.blocked) blockedStreak++
        }
      } catch {
        patch = { status: 'error', error: 'Lỗi mạng' }
        lastHitTikTok = true
      }
      update(i, patch)
      save(current)

      // Hammering TikTok while it blocks us only extends the block — stop and let the user retry later
      if (blockedStreak >= MAX_BLOCKED_STREAK) {
        controller.abort()
        toast.error('Có vẻ TikTok đang chặn, đã tự dừng. Thử lại sau 15–30 phút.', { duration: 10_000 })
      }
    }

    // Anything left untouched after a stop goes back to pending
    current = current.map((r) => (r.status === 'loading' ? { ...r, status: 'pending' } : r))
    setResults(current)
    save(current)
    setRunning(false)
    abortRef.current = null
    if (!controller.signal.aborted) toast.success('Đã chạy xong')
  }

  const startRun = () => {
    const urls = [...new Set(lines.map((l) => l.value.trim()).filter(Boolean))]
    if (urls.length === 0) {
      toast.error('Nhập ít nhất 1 link TikTok')
      return
    }
    const invalid = urls.filter((u) => !/^https:\/\/([a-z]+\.)?tiktok\.com\//i.test(u))
    if (invalid.length) {
      toast.error(`Link không phải TikTok: ${invalid[0]}`)
      return
    }
    // Each run is appended below the previous ones
    const runAt = nowMs()
    run(
      [...results, ...urls.map((url): ResultRow => ({ url, runAt, status: 'pending' }))],
      urls.map((_, i) => results.length + i),
    )
  }

  const retryFailed = () => {
    const failed = results.flatMap((r, i) => (r.status === 'error' || r.status === 'pending' ? [i] : []))
    run(results, failed)
  }

  const deleteRow = (index: number) => {
    const next = results.filter((_, i) => i !== index)
    setResults(next)
    save(next)
  }

  /** Copies a single cell, so it can be pasted into one (possibly merged) Excel cell */
  const copyCell = async (cellKey: string, value: string | number | undefined) => {
    const text = flatten(value)
    if (!text) return
    try {
      await copyText(text)
      setCopiedCell(cellKey)
      setTimeout(() => setCopiedCell((k) => (k === cellKey ? null : k)), 1000)
    } catch {
      toast.error('Không copy được, trình duyệt chặn quyền clipboard')
    }
  }

  const cellClass = (cellKey: string, hasValue: boolean) =>
    cn(
      'border-r px-2 py-2 transition-colors',
      hasValue && 'cursor-copy hover:bg-muted/70',
      copiedCell === cellKey && 'bg-emerald-500/15 hover:bg-emerald-500/15',
    )

  const stt     = numberWithinRuns(results)
  const done    = results.filter((r) => r.status === 'done').length
  const failed  = results.filter((r) => r.status === 'error').length
  const pending = results.filter((r) => r.status === 'pending').length

  return (
    <TikTokShell>
      <div className="grid gap-6">
        {/* Input */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Danh sách link</h2>
                <p className="text-xs text-muted-foreground">Enter để thêm dòng · dán nhiều link cùng lúc</p>
              </div>
              <Badge variant="outline" className={cn('tabular-nums', filled >= MAX_LINKS && 'text-amber-600 border-amber-500/40')}>
                {filled}/{MAX_LINKS}
              </Badge>
            </div>

            <div
              className={cn(
                'rounded-lg border bg-background px-3 py-2 font-mono text-sm focus-within:ring-3 focus-within:ring-ring/50 focus-within:border-ring',
                running && 'opacity-60',
              )}
            >
              {lines.map((line, i) => (
                <div key={line.id} className="flex items-center gap-2">
                  <span className="select-none text-muted-foreground">-</span>
                  <input
                    ref={(el) => { if (el) inputRefs.current.set(line.id, el); else inputRefs.current.delete(line.id) }}
                    value={line.value}
                    disabled={running}
                    autoFocus={i === 0}
                    placeholder={i === 0 ? 'https://www.tiktok.com/@user/video/…' : ''}
                    onChange={(e) => updateLine(line.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={(e) => handlePaste(e, i)}
                    className="h-7 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {running ? (
                <Button variant="destructive" onClick={() => abortRef.current?.abort()}>
                  <Square /> Dừng
                </Button>
              ) : (
                <Button onClick={startRun} disabled={!loaded || filled === 0}>
                  <Play /> Chạy
                </Button>
              )}
              <Button variant="ghost" onClick={clearAll} disabled={running || !loaded}>
                <Trash2 /> Xóa hết
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Mỗi link cách nhau {REQUEST_DELAY_MS / 1000} giây để tránh bị TikTok chặn. Link đã lấy trong {TIKTOK_CACHE_TTL / 60} phút gần đây sẽ trả ngay.
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Kết quả</h2>
                <p className="text-xs text-muted-foreground">
                  {results.length === 0
                    ? 'Chưa có dữ liệu'
                    : `${done} thành công · ${failed} lỗi${pending ? ` · ${pending} đang chờ` : ''}`}
                </p>
                {expiresAt && results.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Lưu {TIKTOK_RESULTS_TTL / 3600} giờ, tự xóa lúc{' '}
                    {expiresAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!running && failed + pending > 0 && done + failed > 0 && (
                  <Button variant="outline" size="sm" onClick={retryFailed}>
                    <RotateCcw /> Chạy lại link lỗi
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={running || done === 0}
                  onClick={() => exportXlsx(results).catch(() => toast.error('Xuất file thất bại'))}
                >
                  <Download /> Tải .xlsx
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th rowSpan={2} className="border-b border-r px-2 py-1.5 font-semibold">STT</th>
                    <th rowSpan={2} className="border-b border-r px-2 py-1.5 text-left font-semibold">Link</th>
                    {TEXT_FIELDS.map((f) => (
                      <th key={f.key} rowSpan={2} className="border-b border-r px-2 py-1.5 text-left font-semibold">
                        <div className="flex items-center gap-1">
                          <span>{f.label}</span>
                          <CopyColumnButton rows={results} column={f} />
                        </div>
                      </th>
                    ))}
                    <th colSpan={METRICS.length} className="border-b border-r px-2 py-1.5 font-semibold">Results</th>
                    <th rowSpan={2} className="border-b px-2 py-1.5 font-semibold">Action</th>
                  </tr>
                  <tr>
                    {METRICS.map((m) => (
                      <th key={m.key} className="border-b border-r px-2 py-1.5 font-semibold last:border-r-0">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{m.label}</span>
                          <CopyColumnButton rows={results} column={m} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={3 + TEXT_FIELDS.length + METRICS.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        {loaded ? 'Nhập link ở trên rồi bấm Chạy' : 'Đang tải kết quả đã lưu…'}
                      </td>
                    </tr>
                  ) : (
                    results.map((r, i) => {
                      const newRun = i === 0 || r.runAt !== results[i - 1].runAt
                      const runSize = results.filter((x) => x.runAt === r.runAt).length
                      return (
                      <Fragment key={`${r.runAt}-${r.url}`}>
                      {newRun && (
                        <tr>
                          <td
                            colSpan={3 + TEXT_FIELDS.length + METRICS.length}
                            className={cn('bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground', i > 0 && 'border-t-2 border-foreground/25')}
                          >
                            {r.runAt ? `Lần chạy lúc ${fmtTime(r.runAt)}` : 'Lần chạy trước'} · {runSize} link
                            {r.runAt <= clearedAt && ' · đã xóa khỏi bộ nhớ, sẽ mất khi tải lại trang'}
                          </td>
                        </tr>
                      )}
                      <tr className={cn(r.status === 'loading' && 'bg-primary/5')}>
                        <td className="border-r px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusIcon status={r.status} />
                            <span className="tabular-nums">{stt[i]}</span>
                          </div>
                        </td>
                        <td className="max-w-56 border-r px-2 py-2">
                          <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-primary hover:underline" title={r.url}>
                            {r.url.replace(/^https:\/\/(www\.)?/, '')}
                          </a>
                        </td>
                        {TEXT_FIELDS.map((f) => {
                          const text    = r.stats?.[f.key] ?? ''
                          const cellKey = `${i}-${f.key}`
                          return (
                            // Long captions are clamped to 2 lines; hover shows the full text. Click copies it.
                            <td
                              key={f.key}
                              onClick={() => copyCell(cellKey, text)}
                              className={cn(cellClass(cellKey, !!text), f.key === 'title' ? 'min-w-32 max-w-48' : 'min-w-48 max-w-80')}
                            >
                              <p className="line-clamp-2 break-words text-xs" title={text || undefined}>{text}</p>
                            </td>
                          )
                        })}
                        {r.stats ? (
                          METRICS.map((m) => {
                            const value   = r.stats?.[m.key]
                            const cellKey = `${i}-${m.key}`
                            return (
                              <td
                                key={m.key}
                                onClick={() => copyCell(cellKey, value)}
                                title={value === undefined ? undefined : 'Bấm để copy'}
                                className={cn(cellClass(cellKey, value !== undefined), 'text-center tabular-nums')}
                              >
                                {fmt(value)}
                              </td>
                            )
                          })
                        ) : (
                          <td colSpan={METRICS.length} className={cn('px-2 py-2 text-center text-xs', r.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
                            {r.status === 'error' ? r.error : r.status === 'loading' ? 'Đang lấy…' : 'Đang chờ'}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={running}
                            onClick={() => deleteRow(i)}
                            title="Xóa dòng này"
                            aria-label="Xóa dòng này"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                      </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {results.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Bấm vào một ô để copy giá trị ô đó, hoặc bấm biểu tượng copy ở tiêu đề để copy cả cột.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </TikTokShell>
  )
}
