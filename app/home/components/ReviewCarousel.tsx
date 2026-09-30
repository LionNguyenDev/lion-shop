'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRow } from './StarRow'
import type { Review } from '../const'

const SLIDE_MS = 5000

const avatarBgs = [
  'from-rose-100 to-pink-200 dark:from-rose-500/20 dark:to-pink-500/10',
  'from-sky-100 to-indigo-200 dark:from-sky-500/20 dark:to-indigo-500/10',
  'from-amber-100 to-orange-200 dark:from-amber-500/20 dark:to-orange-500/10',
  'from-emerald-100 to-teal-200 dark:from-emerald-500/20 dark:to-teal-500/10',
]

/** "Nguyễn Khánh Linh" → "KL" */
function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase()
}

const navBtn =
  'flex items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:scale-110 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-300'

interface ReviewCarouselProps {
  reviews: Review[]
}

export function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  const [idx, setIdx]       = useState(0)
  const [show, setShow]     = useState(true)
  const [paused, setPaused] = useState(false)
  const idxRef              = useRef(0)
  const busy                = useRef(false)

  const go = useCallback((next: number) => {
    if (busy.current) return
    busy.current = true
    idxRef.current = next
    setShow(false)
    setTimeout(() => {
      setIdx(next)
      setShow(true)
      busy.current = false
    }, 300)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => go((idxRef.current + 1) % reviews.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [paused, go, reviews.length])

  const r = reviews[idx]
  const prev = () => go((idxRef.current - 1 + reviews.length) % reviews.length)
  const next = () => go((idxRef.current + 1) % reviews.length)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto max-w-2xl">
        {/* Stacked cards behind for depth */}
        <div aria-hidden className="absolute inset-x-6 -bottom-3 h-full rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40" />
        <div aria-hidden className="absolute inset-x-12 -bottom-6 h-full rounded-3xl border border-slate-200 bg-white/40 dark:border-slate-800 dark:bg-slate-900/20" />

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-12 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
          {/* Progress bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-100 dark:bg-slate-800">
            <div
              key={idx}
              className="h-full origin-left bg-linear-to-r from-emerald-500 via-teal-400 to-amber-400"
              style={{
                animation: `review-progress ${SLIDE_MS}ms linear forwards`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>

          <Quote aria-hidden className="pointer-events-none absolute -right-4 -top-2 h-32 w-32 rotate-12 text-emerald-100 dark:text-emerald-500/10" />

          {/* Card content — fades + slides on change */}
          <div
            className="relative transition-all duration-300 ease-in-out"
            style={{
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0px) scale(1)' : 'translateY(14px) scale(0.98)',
            }}
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
                <Quote className="h-5 w-5 text-white" />
              </div>
              <div key={idx} className="animate-pop-in">
                <StarRow count={r.rating} />
              </div>
            </div>

            <p className="min-h-24 text-base font-medium leading-relaxed text-slate-900 sm:text-lg dark:text-white">
              &ldquo;{r.text}&rdquo;
            </p>

            <div className="mt-8 flex items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-slate-700 shadow-sm dark:text-slate-100', avatarBgs[idx % avatarBgs.length])}>
                {initials(r.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{r.product}</span>
                  <span className="ml-1.5">{r.date}</span>
                </p>
              </div>
              <span className="select-none font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
                {idx + 1} / {reviews.length}
              </span>
            </div>
          </div>
        </div>

        {/* Prev / Next — desktop only */}
        <button onClick={prev} aria-label="Đánh giá trước" className={cn(navBtn, 'absolute left-0 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 sm:flex')}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} aria-label="Đánh giá tiếp theo" className={cn(navBtn, 'absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 sm:flex')}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Avatar strip */}
      <div className="mt-12 flex items-end justify-center gap-3">
        {reviews.map((rev, i) => (
          <button
            key={rev.id}
            onClick={() => go(i)}
            title={rev.name}
            aria-label={`Xem đánh giá của ${rev.name}`}
            aria-current={i === idx}
            className={cn(
              'flex flex-col items-center gap-1.5 transition-all duration-300',
              i === idx ? '-translate-y-1 scale-100' : 'scale-90 opacity-50 hover:scale-95 hover:opacity-80',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-linear-to-br text-xs font-bold text-slate-700 transition-all duration-300 sm:h-11 sm:w-11 sm:text-sm dark:text-slate-100',
                avatarBgs[i % avatarBgs.length],
                i === idx ? 'border-emerald-500 shadow-lg shadow-emerald-500/30' : 'border-transparent',
              )}
            >
              {initials(rev.name)}
            </div>
            <div className={cn('h-1.5 rounded-full transition-all duration-300', i === idx ? 'w-4 bg-emerald-500' : 'w-1.5 bg-transparent')} />
          </button>
        ))}
      </div>

      {/* Prev / Next — mobile only */}
      <div className="mt-5 flex items-center justify-center gap-4 sm:hidden">
        <button onClick={prev} aria-label="Đánh giá trước" className={cn(navBtn, 'h-10 w-10')}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} aria-label="Đánh giá tiếp theo" className={cn(navBtn, 'h-10 w-10')}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
