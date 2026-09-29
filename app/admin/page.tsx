'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { StatsSection } from '@/components/dashboard/StatsSection'
import { formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Order, Product, statusOrders, statusOrdersVN } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** Stock at or below this is surfaced as "low" on the dashboard */
const LOW_STOCK_THRESHOLD = 20
const CRITICAL_STOCK_THRESHOLD = 10

/* ── Types ── */
interface OrderStats {
  total: number
  unpaid: number
  paid: number
  revenue: number
}

interface DashboardData {
  products: Product[]
  orders: Order[]          // recent orders only (first page)
  orderStats: OrderStats
}

/* ── Shared bits ── */
const sectionTitle = 'text-sm font-semibold'

/** Focus ring for card-sized link targets, since the card itself carries no focus style */
const cardLink =
  'block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/* ── Summary tile (all-time figures, secondary to the ranged KPIs above) ── */
function SummaryTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
  loading,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  href?: string
  loading?: boolean
  tone?: 'neutral' | 'alert'
}) {
  const inner = (
    // Hover changes colour only — no transform, so nothing shifts under the pointer
    <Card className="h-full transition-colors duration-200 hover:border-foreground/25 hover:bg-muted/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <Icon
            aria-hidden="true"
            className={cn('h-4 w-4 shrink-0', tone === 'alert' ? 'text-destructive' : 'text-muted-foreground/70')}
          />
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <p className={cn('mt-1.5 font-mono text-2xl font-semibold tabular-nums tracking-tight', tone === 'alert' && 'text-destructive')}>
            {value}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          {sub && !loading
            ? <p className="truncate text-xs text-muted-foreground">{sub}</p>
            : <span />}
          {href && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground">
              Xem <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href} className={cardLink}>{inner}</Link> : inner
}

/* ── Order status bar ── */
const STATUS_COLORS: Record<string, string> = {
  [statusOrders.UNPAID]: 'bg-destructive',
  [statusOrders.PAID]:   'bg-success',
}

function StatusDistribution({ stats }: { stats: OrderStats }) {
  const counts = useMemo(() => {
    return ([
      [statusOrders.PAID,   stats.paid],
      [statusOrders.UNPAID, stats.unpaid],
    ] as [string, number][])
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
  }, [stats])

  const total = stats.total || 1

  return (
    <ul className="space-y-3">
      {counts.map(([status, count]) => {
        const percent = Math.round((count / total) * 100)
        const label   = statusOrdersVN[status] ?? status
        return (
          <li key={status} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
            {/* The bar is decorative; the count and percentage next to it carry the value */}
            <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn('block h-full rounded-full', STATUS_COLORS[status] ?? 'bg-muted-foreground')}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-xs font-semibold tabular-nums">
              {count} · {percent}%
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ── Recent orders mini-table ── */
const STATUS_BADGE: Record<string, string> = {
  [statusOrders.UNPAID]: 'bg-destructive/10 text-destructive border-destructive/25',
  [statusOrders.PAID]:   'bg-success/10 text-success border-success/25',
}

function SectionCard({
  title,
  action,
  children,
  badge,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3">
        <CardTitle className={sectionTitle}>
          <h2 className="flex items-center gap-2">
            {title}
            {badge}
          </h2>
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Icon aria-hidden="true" className="h-8 w-8 opacity-30" />
      <p className="text-sm">{children}</p>
    </div>
  )
}

function RecentOrders({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const recent = orders.slice(0, 6)

  return (
    <SectionCard
      title="Đơn hàng gần đây"
      action={
        <Link href="/admin/orders" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 text-xs')}>
          Xem tất cả <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState icon={ShoppingCart}>Chưa có đơn hàng</EmptyState>
      ) : (
        <ul className="divide-y">
          {recent.map((o) => (
            <li key={o._id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                {o.name?.[0] ?? '?'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  #{o._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn('shrink-0 text-xs font-semibold', STATUS_BADGE[o.status] ?? 'bg-muted text-muted-foreground')}
              >
                {statusOrdersVN[o.status] || o.status}
              </Badge>
              <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                {formatVND(o.totalAmount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

/* ── Low stock list ── */
function LowStockList({ products, loading }: { products: Product[]; loading: boolean }) {
  const low = products
    .filter((p) => p.stock < LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
  const total = products.filter((p) => p.stock < LOW_STOCK_THRESHOLD).length

  return (
    <SectionCard
      title="Cảnh báo tồn kho thấp"
      badge={
        !loading && total > 0 ? (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/25 font-mono tabular-nums">
            {total}
          </Badge>
        ) : undefined
      }
      action={
        <Link href="/admin/products" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 text-xs')}>
          Quản lý <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : low.length === 0 ? (
        <EmptyState icon={Package}>Tất cả sản phẩm đủ hàng</EmptyState>
      ) : (
        <ul className="divide-y">
          {low.map((p) => (
            <li key={p._id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
                <Package aria-hidden="true" className="h-4 w-4 text-muted-foreground/60" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{formatVND(p.sellingPrice)}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 font-mono text-xs font-bold tabular-nums',
                  // Out of stock and critically low share the danger tone; the rest warn in amber
                  p.stock < CRITICAL_STOCK_THRESHOLD
                    ? 'bg-destructive/10 text-destructive border-destructive/25'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
                )}
              >
                {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

/* ── Page ── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    products: [],
    orders: [],
    orderStats: { total: 0, unpaid: 0, paid: 0, revenue: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  // Promise chain (not async/await) so the mount effect doesn't setState synchronously
  const load = useCallback(() => {
    Promise.all([fetch('/api/products?limit=500'), fetch('/api/orders?limit=6')])
      .then((responses) => {
        if (responses.some((r) => !r.ok)) throw new Error('Request failed')
        return Promise.all(responses.map((r) => r.json()))
      })
      .then(([productsRes, ordersRes]) => setData({
        products:   productsRes.products ?? [],
        orders:     ordersRes.orders ?? [],
        orderStats: ordersRes.stats ?? { total: 0, unpaid: 0, paid: 0, revenue: 0 },
      }))
      // Showing zeros would read as "no orders" — say it failed and offer a retry instead
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const retry = () => {
    setLoading(true)
    setError(false)
    load()
  }

  const unpaidCount    = data.orderStats.unpaid
  const lowStockCount  = data.products.filter((p) => p.stock < LOW_STOCK_THRESHOLD).length
  const inventoryValue = useMemo(
    () => data.products.reduce((s, p) => s + p.stock * p.originalPrice, 0),
    [data.products],
  )

  const summaryTiles = [
    {
      label: 'Tổng doanh thu',
      value: loading || error ? '—' : formatVND(data.orderStats.revenue),
      sub:   'Các đơn đã thanh toán',
      icon:  Wallet,
      href:  '/admin/orders',
    },
    {
      label: 'Tổng đơn hàng',
      value: loading || error ? '—' : data.orderStats.total.toLocaleString('vi-VN'),
      sub:   `${unpaidCount} chưa thanh toán`,
      icon:  ShoppingCart,
      href:  '/admin/orders',
    },
    {
      label: 'Tổng sản phẩm',
      value: loading || error ? '—' : data.products.length.toLocaleString('vi-VN'),
      sub:   `${lowStockCount} sắp hết hàng`,
      icon:  Package,
      href:  '/admin/products',
    },
    {
      label: 'Giá trị kho hàng',
      value: loading || error ? '—' : formatVND(inventoryValue),
      sub:   'Theo giá vốn',
      icon:  TrendingUp,
    },
  ]

  return (
    <AppShell
      title="Tổng quan"
      description="Chào mừng trở lại — đây là tổng quan cửa hàng của bạn"
      orderBadge={unpaidCount || undefined}
      productBadge={lowStockCount || undefined}
    >
      <div className="space-y-6">
        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm">
                  Không tải được dữ liệu cửa hàng. Kiểm tra kết nối rồi thử lại.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCw aria-hidden="true" /> Thử lại
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ranged KPIs + revenue chart — the primary view, so it leads */}
        <StatsSection />

        {/* All-time totals */}
        <section aria-labelledby="totals-heading" className="space-y-3">
          <h2 id="totals-heading" className={cn(sectionTitle, 'text-muted-foreground')}>
            Toàn thời gian
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryTiles.map((t) => (
              <SummaryTile key={t.label} loading={loading} {...t} />
            ))}
          </div>
        </section>

        {/* Order status + recent orders */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SectionCard title="Trạng thái đơn hàng">
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : data.orderStats.total === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Chưa có đơn hàng</p>
                ) : (
                  <StatusDistribution stats={data.orderStats} />
                )}
              </div>
            </SectionCard>
          </div>
          <div className="lg:col-span-3">
            <RecentOrders orders={data.orders} loading={loading} />
          </div>
        </div>

        <LowStockList products={data.products} loading={loading} />
      </div>
    </AppShell>
  )
}
