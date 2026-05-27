'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRow } from './StarRow'
import type { Review } from '../const'

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
    const id = setInterval(() => go((idxRef.current + 1) % reviews.length), 3000)
    return () => clearInterval(id)
  }, [paused, go, reviews.length])

  const r = reviews[idx]

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-12">

          {/* Progress bar */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-200 dark:bg-slate-800">
            <div
              key={idx}
              className="h-full origin-left bg-slate-900 dark:bg-white"
              style={{
                animation: 'review-progress 5s linear forwards',
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>

          {/* Card content — fades + slides on change */}
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0px)' : 'translateY(14px)',
            }}
          >
            {/* Quote icon + stars */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Quote className="h-5 w-5 text-slate-400 dark:text-slate-600" />
              </div>
              <StarRow count={r.rating} />
            </div>

            {/* Review text */}
            <p className="text-base sm:text-lg leading-relaxed font-medium text-slate-900 dark:text-white min-h-[96px]">
              &ldquo;{r.text}&rdquo;
            </p>

            {/* Reviewer */}
            <div className="mt-8 flex items-center gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xl shadow-sm border border-slate-300 dark:border-slate-600">
                {r.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{r.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{r.product} · {r.date}</p>
              </div>
              <span className="text-xs tabular-nums text-slate-400 dark:text-slate-600 font-mono select-none">
                {idx + 1} / {reviews.length}
              </span>
            </div>
          </div>
        </div>

        {/* Prev / Next — desktop only */}
        <button
          onClick={() => go((idxRef.current - 1 + reviews.length) % reviews.length)}
          aria-label="Đánh giá trước"
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 hover:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >‹</button>
        <button
          onClick={() => go((idxRef.current + 1) % reviews.length)}
          aria-label="Đánh giá tiếp theo"
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 hover:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >›</button>
      </div>

      {/* Avatar dot strip */}
      <div className="mt-8 flex items-end justify-center gap-3">
        {reviews.map((rev, i) => (
          <button
            key={rev.id}
            onClick={() => go(i)}
            title={rev.name}
            className={cn(
              'flex flex-col items-center gap-1.5 transition-all duration-300',
              i === idx ? 'scale-100' : 'scale-90 opacity-50 hover:opacity-75 hover:scale-95',
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-lg sm:text-xl transition-all duration-300 border-2',
                i === idx
                  ? 'border-slate-900 bg-slate-200 dark:border-white dark:bg-slate-700 shadow-sm'
                  : 'border-transparent bg-slate-100 dark:bg-slate-800',
              )}
            >
              {rev.avatar}
            </div>
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all duration-300',
                i === idx ? 'bg-slate-900 dark:bg-white' : 'bg-transparent',
              )}
            />
          </button>
        ))}
      </div>

      {/* Prev / Next — mobile only */}
      <div className="mt-5 flex sm:hidden items-center justify-center gap-4">
        <button
          onClick={() => go((idxRef.current - 1 + reviews.length) % reviews.length)}
          aria-label="Đánh giá trước"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 transition-all duration-200 text-slate-600 dark:text-slate-400"
        >‹</button>
        <button
          onClick={() => go((idxRef.current + 1) % reviews.length)}
          aria-label="Đánh giá tiếp theo"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 transition-all duration-200 text-slate-600 dark:text-slate-400"
        >›</button>
      </div>
    </div>
  )
}
