'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  ChevronRight,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number | null
}

interface SidebarProps {
  orderBadge?: number
  productBadge?: number
}

const baseNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
]

const systemNav: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <Badge
          className={cn(
            'h-5 min-w-5 px-1.5 text-[10px] font-bold border-transparent',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary/10 text-primary',
          )}
        >
          {item.badge}
        </Badge>
      )}
      {active && <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
    </Link>
  )
}

export function Sidebar({ orderBadge, productBadge }: SidebarProps) {
  const pathname = usePathname()

  const mainNav: NavItem[] = baseNav.map((item) => ({
    ...item,
    badge:
      item.href === '/orders' ? orderBadge
      : item.href === '/products' ? productBadge
      : item.badge,
  }))

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Store className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none">Lion Shop</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Main
          </p>
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
            />
          ))}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            System
          </p>
          {systemNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted transition-colors cursor-default">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            A
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">Admin</p>
            <p className="truncate text-[10px] text-muted-foreground">admin@lionshop.vn</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
