'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useCountUp } from './utils'

const STATS = [
  { value: 7,    suffix: '+', label: 'Năm kinh nghiệm', icon: '🏆',
    color: 'text-slate-900 dark:text-white',  glowColor: 'transparent',   sub: 'text-slate-600 dark:text-slate-400'  },
  { value: 4000, suffix: '+', label: 'Sản phẩm',        icon: '📦',
    color: 'text-slate-900 dark:text-white', glowColor: 'transparent',  sub: 'text-slate-600 dark:text-slate-400' },
  { value: 3,    suffix: '',  label: 'Kho toàn quốc',   icon: '🏭',
    color: 'text-slate-900 dark:text-white',   glowColor: 'transparent',  sub: 'text-slate-600 dark:text-slate-400'   },
  { value: 73,   suffix: '',  label: 'Tỉnh thành',      icon: '🗺️',
    color: 'text-slate-900 dark:text-white',    glowColor: 'transparent',   sub: 'text-slate-600 dark:text-slate-400'    },
]

function StatItem({ stat, started }: { stat: typeof STATS[0]; started: boolean }) {
  const count = useCountUp(stat.value, 1600, started)
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-2 relative">
      <span className="text-2xl mb-1">{stat.icon}</span>
      <p
        className={cn('text-4xl sm:text-5xl font-black tabular-nums', stat.color)}
        style={{ filter: `drop-shadow(0 0 20px ${stat.glowColor})` }}
      >
        {count.toLocaleString('vi-VN')}{stat.suffix}
      </p>
      <p className={cn('text-sm sm:text-base font-medium tracking-wide', stat.sub)}>{stat.label}</p>
    </div>
  )
}

export function StatsSection() {
  const [statsStarted, setStatsStarted] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsStarted(true); observer.disconnect() } },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={statsRef} className="relative z-10 w-full overflow-hidden">
      <div className="relative border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0" />

        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-slate-200 dark:sm:divide-slate-800">
            {STATS.map((stat) => (
              <StatItem key={stat.label} stat={stat} started={statsStarted} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
