'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { buttonVariants } from '@/components/ui/button'

export function ThemeToggleBtn() {
  const { setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(
        document.documentElement.classList.contains('dark') ? 'light' : 'dark'
      )}
      aria-label="Đổi giao diện"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 shadow-sm transition-all duration-200 hover:bg-slate-100 hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block dark:hidden" />
    </button>
  )
}
