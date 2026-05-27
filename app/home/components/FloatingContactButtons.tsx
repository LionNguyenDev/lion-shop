'use client'

import { Icons } from '@/assets/icons'

export function FloatingContactButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Zalo */}
      <div className="group flex items-center gap-3">
        <span className="pointer-events-none select-none whitespace-nowrap rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-slate-800 opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          Nhắn Zalo 💙
        </span>
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-slate-500/30" />
          <a
            href="https://zalo.me/0826223912"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Zalo"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border-2 border-white/10 text-white shadow-lg dark:bg-white dark:text-slate-900 dark:border-slate-700 hover:scale-110 transition-transform duration-200"
          >
            <Icons.Zalo className="h-8 w-8" />
          </a>
        </div>
      </div>

      {/* Messenger */}
      <div className="group flex items-center gap-3">
        <span className="pointer-events-none select-none whitespace-nowrap rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg dark:bg-slate-800 opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          Nhắn Messenger 💬
        </span>
        <div className="relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-slate-500/30" style={{ animationDelay: '0.7s' }} />
          <a
            href="https://m.me/ThuyLinhLion206"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Messenger"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border-2 border-white/10 text-white shadow-lg dark:bg-white dark:text-slate-900 dark:border-slate-700 hover:scale-110 transition-transform duration-200"
          >
            <Icons.Messenger className="h-8 w-8" />
          </a>
        </div>
      </div>
    </div>
  )
}
