'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface CurrentUser {
  id: string
  name: string
  username: string
  role: 'admin' | 'staff'
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
  const router   = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    const tid = toast.loading('Signing out…')
    await fetch('/api/auth/signout', { method: 'POST' })
    toast.success('Signed out', { id: tid })
    router.push('/landing')
    router.refresh()
  }

  const mainNav: NavItem[] = baseNav.map((item) => ({
    ...item,
    badge:
      item.href === '/orders' ? orderBadge
      : item.href === '/products' ? productBadge
      : item.badge,
  }))

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U'

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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2.5 px-2 py-2"
              />
            }
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-pink-500 text-white text-xs font-bold">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold">{user?.name ?? '—'}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                @{user?.username ?? '—'}
                {user?.role === 'admin' && <span className="ml-1 text-violet-500">· admin</span>}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
