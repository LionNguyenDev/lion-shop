'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
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
import { TIKTOK_CACHE_TTL } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const MAX_LINKS        = 15
const REQUEST_DELAY_MS = 4000
/** Consecutive "TikTok is refusing us" errors before the run stops itself */
const MAX_BLOCKED_STREAK = 3

interface Stats {
  views: number
  likes: number
  comments: number
  favorites: number
  shares: number
  cached: boolean
}

type RowStatus = 'pending' | 'loading' | 'done' | 'error'

interface ResultRow {
  url: string
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

const fmt = (n: number) => n.toLocaleString('vi-VN')

async function exportXlsx(rows: ResultRow[]) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('TikTok')

  ws.columns = [
    { width: 6 }, { width: 60 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 10 },
  ]

  // Two-row header: "Results" spans the 5 metric columns, STT/Link span both rows
  ws.getRow(1).values = ['STT', 'Link', 'Results']
  ws.getRow(2).values = ['', '', 'View', 'Like', 'CMT', 'Added to Favorites', 'Share']
  ws.mergeCells('A1:A2')
  ws.mergeCells('B1:B2')
  ws.mergeCells('C1:G1')
  ws.getRow(2).height = 32

  rows.forEach((r, i) => {
    const s = r.stats
    const row = ws.addRow(
      s
        ? [i + 1, r.url, s.views, s.likes, s.comments, s.favorites, s.shares]
        : [i + 1, r.url, `Lỗi: ${r.error ?? 'chưa chạy'}`],
    )
    row.getCell(2).value = { text: r.url, hyperlink: r.url }
    if (!s) ws.mergeCells(row.number, 3, row.number, 7)
  })

  const border = { style: 'thin' as const }
  ws.eachRow((row, rowNumber) => {
    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c)
      cell.border = { top: border, left: border, bottom: border, right: border }
      if (rowNumber <= 2) {
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      } else if (c === 2) {
        cell.font = { color: { argb: 'FF0563C1' }, underline: true }
      } else if (c >= 3) {
        cell.numFmt = '#,##0'
        cell.alignment = { horizontal: 'center' }
      } else {
        cell.alignment = { horizontal: 'center' }
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
  const inputRefs             = useRef(new Map<number, HTMLInputElement>())
  const abortRef              = useRef<AbortController | null>(null)

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

  const clearAll = () => {
    const first = newLine()
    setLines([first])
    setResults([])
    focusLine(first.id)
  }

  /* ── Run ── */
  const run = async (rows: ResultRow[], onlyIndexes: number[]) => {
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setResults(rows)

    let lastHitTikTok = false
    let blockedStreak = 0
    for (const i of onlyIndexes) {
      if (controller.signal.aborted) break
      // Only throttle when the previous request actually went to TikTok (cache hits are free)
      if (lastHitTikTok) await sleep(REQUEST_DELAY_MS, controller.signal)
      if (controller.signal.aborted) break

      setResults((prev) => prev.map((r, j) => (j === i ? { ...r, status: 'loading', error: undefined } : r)))
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
      setResults((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))

      // Hammering TikTok while it blocks us only extends the block — stop and let the user retry later
      if (blockedStreak >= MAX_BLOCKED_STREAK) {
        controller.abort()
        toast.error('Có vẻ TikTok đang chặn, đã tự dừng. Thử lại sau 15–30 phút.', { duration: 10_000 })
      }
    }

    // Anything left untouched after a stop goes back to pending
    setResults((prev) => prev.map((r) => (r.status === 'loading' ? { ...r, status: 'pending' } : r)))
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
    run(urls.map((url) => ({ url, status: 'pending' })), urls.map((_, i) => i))
  }

  const retryFailed = () => {
    const failed = results.flatMap((r, i) => (r.status === 'error' || r.status === 'pending' ? [i] : []))
    run(results, failed)
  }

  const done    = results.filter((r) => r.status === 'done').length
  const failed  = results.filter((r) => r.status === 'error').length
  const pending = results.filter((r) => r.status === 'pending').length

  return (
    <TikTokShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
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
                <Button onClick={startRun} disabled={filled === 0}>
                  <Play /> Chạy
                </Button>
              )}
              <Button variant="ghost" onClick={clearAll} disabled={running}>
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
                    <th colSpan={5} className="border-b px-2 py-1.5 font-semibold">Results</th>
                  </tr>
                  <tr>
                    {['View', 'Like', 'CMT', 'Added to Favorites', 'Share'].map((h) => (
                      <th key={h} className="border-b border-r px-2 py-1.5 font-semibold last:border-r-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Nhập link bên trái rồi bấm Chạy
                      </td>
                    </tr>
                  ) : (
                    results.map((r, i) => (
                      <tr key={r.url} className={cn(r.status === 'loading' && 'bg-primary/5')}>
                        <td className="border-r px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusIcon status={r.status} />
                            <span className="tabular-nums">{i + 1}</span>
                          </div>
                        </td>
                        <td className="max-w-56 border-r px-2 py-2">
                          <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-primary hover:underline" title={r.url}>
                            {r.url.replace(/^https:\/\/(www\.)?/, '')}
                          </a>
                        </td>
                        {r.stats ? (
                          [r.stats.views, r.stats.likes, r.stats.comments, r.stats.favorites, r.stats.shares].map((v, j) => (
                            <td key={j} className="border-r px-2 py-2 text-center tabular-nums last:border-r-0">{fmt(v)}</td>
                          ))
                        ) : (
                          <td colSpan={5} className={cn('px-2 py-2 text-center text-xs', r.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
                            {r.status === 'error' ? r.error : r.status === 'loading' ? 'Đang lấy…' : 'Đang chờ'}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TikTokShell>
  )
}
