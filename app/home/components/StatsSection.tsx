'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPinned, Package, Trophy, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCountUp } from './utils'

const STATS = [
  { value: 7,    suffix: '+', label: 'Năm kinh nghiệm', icon: Trophy,
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',     bar: 'from-amber-400 to-orange-400',  glow: 'hover:shadow-amber-500/15' },
  { value: 4000, suffix: '+', label: 'Sản phẩm',        icon: Package,
    chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'from-emerald-500 to-teal-400',  glow: 'hover:shadow-emerald-500/15' },
  { value: 3,    suffix: '',  label: 'Kho toàn quốc',   icon: Warehouse,
    chip: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',         bar: 'from-sky-400 to-indigo-400',    glow: 'hover:shadow-sky-500/15' },
  { value: 73,   suffix: '',  label: 'Tỉnh thành',      icon: MapPinned,
    chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',       bar: 'from-rose-400 to-pink-400',     glow: 'hover:shadow-rose-500/15' },
]

function StatItem({ stat, started, index }: { stat: typeof STATS[0]; started: boolean; index: number }) {
  const count = useCountUp(stat.value, 1600, started)
  const Icon = stat.icon
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-900/60',
        stat.glow,
        started ? 'animate-pop-in' : 'opacity-0',
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r transition-transform duration-500 group-hover:scale-x-100', stat.bar)} />
      <span className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', stat.chip)}>
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {count.toLocaleString('vi-VN')}{stat.suffix}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
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
    <div ref={statsRef} className="relative z-10 mx-auto max-w-6xl px-6 pb-8 lg:px-12">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} started={statsStarted} index={i} />
        ))}
      </div>
    </div>
  )
}
