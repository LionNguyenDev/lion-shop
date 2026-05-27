'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, Bell, LogOut, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  orderBadge?: number
  productBadge?: number
}

function ThemeToggle() {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Đổi giao diện</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Sáng</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Tối</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>Hệ thống</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header({ title, description, orderBadge, productBadge }: HeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const tid = toast.loading('Đang đăng xuất…')
    await fetch('/api/auth/signout', { method: 'POST' })
    toast.success('Đã đăng xuất', { id: tid })
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn('lg:hidden')}
            />
          }
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <Sidebar orderBadge={orderBadge} productBadge={productBadge} />
        </SheetContent>
      </Sheet>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />

        {/* Trang chủ */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              />
            }
          >
            <Store className="h-4 w-4" />
            <span className="sr-only">Trang chủ</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Trang chủ</TooltipContent>
        </Tooltip>

        {/* Đăng xuất */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              />
            }
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Đăng xuất</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Đăng xuất</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
