'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Order, Product, statusOrders } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/* ── Types ── */
interface DashboardData {
  products: Product[]
  orders: Order[]
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  loading,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  href?: string
  loading?: boolean
  accent: string
}) {
  const inner = (
    <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/50 bg-card/70 backdrop-blur-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            )}
            {sub && !loading && (
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent transition-transform duration-300 group-hover:scale-110', accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {href && (
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            View all <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

/* ── Order status bar ── */
const STATUS_COLORS: Record<string, string> = {
  [statusOrders.UNPAID]:     'bg-red-500',
  [statusOrders.PAID]:       'bg-green-500',
  [statusOrders.PROCESSING]: 'bg-blue-500',
  [statusOrders.COMPLETED]:  'bg-slate-400',
  [statusOrders.CANCELLED]:  'bg-orange-500',
  [statusOrders.PENDING]:    'bg-yellow-500',
  [statusOrders.SHIPPED]:    'bg-purple-500',
  [statusOrders.DELIVERED]:  'bg-teal-500',
  [statusOrders.RETURNED]:   'bg-pink-500',
  [statusOrders.FAILED]:     'bg-red-800',
}

function StatusDistribution({ orders }: { orders: Order[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [orders])

  const total = orders.length || 1

  return (
    <div className="space-y-3">
      {counts.map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-xs text-muted-foreground truncate">{status}</div>
          <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
            <div
              className={cn('h-full rounded-full transition-all duration-500', STATUS_COLORS[status] ?? 'bg-slate-500')}
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <div className="w-8 text-right text-xs font-semibold tabular-nums">{count}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Recent orders mini-table ── */
const STATUS_BADGE: Record<string, string> = {
  [statusOrders.UNPAID]:     'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30',
  [statusOrders.PAID]:       'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
  [statusOrders.PROCESSING]: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
  [statusOrders.COMPLETED]:  'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 dark:border-zinc-500/30',
  [statusOrders.CANCELLED]:  'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/30',
}

function RecentOrders({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const recent = orders.slice(0, 6)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
        <Link href="/orders" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' text-xs h-7'}>
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recent.map((o) => (
              <div key={o._id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase">
                  {o.name?.[0] ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{o._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-semibold shrink-0', STATUS_BADGE[o.status] ?? 'bg-slate-100 text-slate-600')}
                >
                  {o.status}
                </Badge>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatVND(o.totalAmount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Low stock list ── */
function LowStockList({ products, loading }: { products: Product[]; loading: boolean }) {
  const low = products.filter((p) => p.stock <= 5).slice(0, 6)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <CardTitle className="text-sm font-semibold">Low Stock Alerts</CardTitle>
        <Link href="/products" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' text-xs h-7'}>
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : low.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-sm">All products well stocked</p>
          </div>
        ) : (
          <div className="divide-y">
            {low.map((p) => (
              <div key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
                  <Package className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatVND(p.sellingPrice)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-xs font-bold',
                    p.stock === 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
                  )}
                >
                  {p.stock === 0 ? 'Out' : `${p.stock} left`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Page ── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ products: [], orders: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/api/products'), fetch('/api/orders')])
      .then(([pRes, oRes]) => Promise.all([pRes.json(), oRes.json()]))
      .then(([products, orders]) => setData({ products, orders }))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const revenue = useMemo(
    () => data.orders.reduce((s, o) => s + o.totalAmount, 0),
    [data.orders],
  )
  const unpaidCount  = data.orders.filter((o) => o.status === statusOrders.UNPAID).length
  const lowStockCount = data.products.filter((p) => p.stock <= 5).length

  const statCards = [
    {
      label: 'Total Revenue',
      value: loading ? '—' : formatVND(revenue),
      sub: 'All orders combined',
      icon: Wallet,
      href: '/orders',
      accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
    },
    {
      label: 'Total Orders',
      value: loading ? '—' : data.orders.length.toLocaleString('vi-VN'),
      sub: `${unpaidCount} unpaid`,
      icon: ShoppingCart,
      href: '/orders',
      accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
    },
    {
      label: 'Total Products',
      value: loading ? '—' : data.products.length.toLocaleString('vi-VN'),
      sub: `${lowStockCount} low stock`,
      icon: Package,
      href: '/products',
      accent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30',
    },
    {
      label: 'Stock Alerts',
      value: loading ? '—' : lowStockCount,
      sub: lowStockCount > 0 ? 'Needs restocking' : 'All good',
      icon: AlertTriangle,
      href: '/products',
      accent:
        lowStockCount > 0
          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30'
          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 dark:border-zinc-500/30',
    },
    {
      label: 'Inventory Value',
      value: loading ? '—' : formatVND(data.products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)),
      sub: 'At selling price',
      icon: TrendingUp,
      accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
    },
  ]

  return (
    <AppShell
      title="Dashboard"
      description="Welcome back — here's your shop overview"
      orderBadge={unpaidCount || undefined}
      productBadge={lowStockCount || undefined}
    >
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((s) => (
          <StatCard key={s.label} loading={loading} {...s} />
        ))}
      </div>

      {/* Mid row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Order status distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
              </div>
            ) : data.orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No orders yet</p>
            ) : (
              <StatusDistribution orders={data.orders} />
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <div className="lg:col-span-3">
          <RecentOrders orders={data.orders} loading={loading} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-6">
        <LowStockList products={data.products} loading={loading} />
      </div>
    </AppShell>
  )
}
