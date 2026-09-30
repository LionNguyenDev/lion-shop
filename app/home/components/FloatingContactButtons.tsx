'use client'

import { Icons } from '@/assets/icons'

const buttons = [
  { href: 'https://zalo.me/0826223912',     label: 'Nhắn Zalo',      aria: 'Nhắn Zalo',      Icon: Icons.Zalo,      ping: 'bg-sky-400/40',    delay: '0s' },
  { href: 'https://m.me/ThuyLinhLion206',   label: 'Nhắn Messenger', aria: 'Nhắn Messenger', Icon: Icons.Messenger, ping: 'bg-fuchsia-400/40', delay: '0.7s' },
]

export function FloatingContactButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {buttons.map(({ href, label, aria, Icon, ping, delay }, i) => (
        <div key={href} className="group flex items-center gap-3 animate-pop-in" style={{ animationDelay: `${0.8 + i * 0.15}s` }}>
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg translate-x-2 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
            {label}
          </span>
          <div className="relative">
            <span className={`absolute inset-0 rounded-full animate-ping ${ping}`} style={{ animationDelay: delay }} />
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={aria}
              className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-900/15 transition-all duration-200 hover:-rotate-12 hover:scale-110 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
            >
              <Icon className="h-8 w-8" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
