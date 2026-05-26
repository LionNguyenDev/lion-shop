'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatProfit, formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'

type Range = 'today' | '7d' | '30d' | '365d'
type Metric = 'revenue' | 'profit'

interface BucketRow { bucket: string; orders: number; revenue: number; profit: number }
interface PeriodSummary { orders: number; revenue: number; profit: number; buckets: BucketRow[] }
interface StatsResult { range: Range; current: PeriodSummary; previous: PeriodSummary }

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d',    label: '7 ngày' },
  { value: '30d',   label: '30 ngày' },
  { value: '365d',  label: '365 ngày' },
]

const compactVND = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

/* ── Helpers ── */

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function formatBucketLabel(bucket: string, range: Range): string {
  if (range === 'today') return `${bucket}h`
  if (range === '365d') {
    const [, m] = bucket.split('-')
    return `T${parseInt(m, 10)}`
  }
  // 7d / 30d → "DD/MM"
  const [, m, d] = bucket.split('-')
  return `${d}/${m}`
}

function formatTooltipLabel(bucket: string, range: Range): string {
  if (range === 'today') return `${bucket}:00`
  if (range === '365d') {
    const [y, m] = bucket.split('-')
    return `Tháng ${parseInt(m, 10)}/${y}`
  }
  const [y, m, d] = bucket.split('-')
  const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)))
  const weekday = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getUTCDay()]
  return `${weekday}, ${d}/${m}/${y}`
}

/* ── KPI card ── */

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
  loading,
}: {
  label: string
  value: string
  delta: number | null
  icon: React.ElementType
  accent: string
  loading: boolean
}) {
  const positive = delta != null && delta > 0
  const negative = delta != null && delta < 0
  const zero     = delta != null && delta === 0

  return (
    <Card className="border-border/50 bg-card/70 backdrop-blur-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums truncate">{value}</p>
            )}
            {loading ? (
              <Skeleton className="mt-2 h-4 w-20" />
            ) : (
              <div className="mt-1.5 flex items-center gap-1.5">
                {delta == null ? (
                  <span className="text-xs text-muted-foreground">— so với kỳ trước</span>
                ) : (
                  <>
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
                        positive && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        negative && 'bg-red-500/10 text-red-600 dark:text-red-400',
                        zero     && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {positive && <ArrowUpRight className="h-3 w-3" />}
                      {negative && <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(delta).toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">so với kỳ trước</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Chart tooltip ── */

interface ChartPoint { value: number; name: string; color: string }

function ChartTooltip({
  active,
  payload,
  label,
  range,
  metric,
}: {
  active?: boolean
  payload?: ChartPoint[]
  label?: string
  range: Range
  metric: Metric
}) {
  if (!active || !payload?.length || !label) return null
  const value = payload[0].value
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">{formatTooltipLabel(label, range)}</p>
      <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: payload[0].color }}>
        {metric === 'revenue' ? formatVND(value) : formatProfit(value)}
      </p>
    </div>
  )
}

/* ── Main section ── */

export function StatsSection() {
  const [range, setRange]     = useState<Range>('7d')
  const [metric, setMetric]   = useState<Metric>('revenue')
  const [data, setData]       = useState<StatsResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/stats?range=${range}`)
      .then((r) => r.json())
      .then((d: StatsResult) => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [range])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.current.buckets.map((b) => ({
      bucket: b.bucket,
      value: metric === 'revenue' ? b.revenue : b.profit,
    }))
  }, [data, metric])

  const ordersDelta  = data ? pctChange(data.current.orders,  data.previous.orders)  : null
  const revenueDelta = data ? pctChange(data.current.revenue, data.previous.revenue) : null
  const profitDelta  = data ? pctChange(data.current.profit,  data.previous.profit)  : null

  const profitNegative = (data?.current.profit ?? 0) < 0
  const chartColor = metric === 'profit'
    ? (profitNegative ? 'var(--color-chart-loss)' : 'var(--color-chart-profit)')
    : 'var(--color-chart-revenue)'

  return (
    <section className="mt-6 space-y-4">
      {/* Header + range tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Thống kê</h2>
          <p className="text-xs text-muted-foreground">Số đơn, doanh thu và lãi/lỗ theo khoảng thời gian</p>
        </div>
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                range === opt.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Số đơn hàng"
          value={data?.current.orders.toLocaleString('vi-VN') ?? '—'}
          delta={ordersDelta}
          icon={ShoppingCart}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <KpiCard
          label="Doanh thu"
          value={data ? formatVND(data.current.revenue) : '—'}
          delta={revenueDelta}
          icon={Wallet}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <KpiCard
          label="Lãi / Lỗ"
          value={data ? formatProfit(data.current.profit) : '—'}
          delta={profitDelta}
          icon={TrendingUp}
          accent={
            profitNegative
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }
          loading={loading}
        />
      </div>

      {/* Chart */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-md">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {metric === 'revenue' ? 'Biểu đồ doanh thu' : 'Biểu đồ lãi/lỗ'}
            </p>
            <div className="inline-flex rounded-lg border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setMetric('revenue')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                  metric === 'revenue'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Doanh thu
              </button>
              <button
                type="button"
                onClick={() => setMetric('profit')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                  metric === 'profit'
                    ? cn(
                        'bg-background shadow-sm',
                        profitNegative ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
                      )
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Lãi/Lỗ
              </button>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-70 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu cho khoảng thời gian này
            </div>
          ) : (
            <div
              className="h-70 w-full"
              style={{
                // Color tokens for the chart gradient/stroke
                '--color-chart-revenue': 'oklch(0.696 0.17 162.48)',
                '--color-chart-profit':  'oklch(0.769 0.188 70.08)',
                '--color-chart-loss':    'oklch(0.704 0.191 22.216)',
              } as React.CSSProperties}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={chartColor} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={(b) => formatBucketLabel(b, range)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={range === '30d' ? 24 : 4}
                  />
                  <YAxis
                    tickFormatter={(v) => compactVND.format(v) + '₫'}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ stroke: chartColor, strokeWidth: 1, strokeOpacity: 0.3 }}
                    content={(props) => (
                      <ChartTooltip
                        active={props.active}
                        payload={props.payload as unknown as ChartPoint[]}
                        label={props.label as string}
                        range={range}
                        metric={metric}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#chartFill)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: chartColor, fill: 'var(--background)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
