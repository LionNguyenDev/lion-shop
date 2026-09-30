'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Fades + lifts its children in the first time they scroll into view */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={cn(
        'group/reveal relative z-10 transition-all duration-700 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface SectionHeadingProps {
  eyebrow: string
  title: React.ReactNode
  description?: string
  /** Shown in a tilted chip after the title */
  icon?: React.ElementType
}

export function SectionHeading({ eyebrow, title, description, icon: Icon }: SectionHeadingProps) {
  return (
    <div className="mb-12 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {eyebrow}
      </span>
      <h2 className="mt-4 flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {title}
        {Icon && (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 animate-float-tilt sm:h-11 sm:w-11">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
        )}
      </h2>
      {description && (
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">{description}</p>
      )}
      <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-linear-to-r from-emerald-500 via-teal-400 to-amber-400 bg-gradient-animated" />
    </div>
  )
}
