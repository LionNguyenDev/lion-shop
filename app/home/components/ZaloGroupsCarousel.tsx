'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ZaloGroup {
  id: number
  name: string
  description: string
  members: string
  info: string
  screenshotBg: string
  link: string
}

interface ZaloGroupsCarouselProps {
  groups: ZaloGroup[]
}

export function ZaloGroupsCarousel({ groups }: ZaloGroupsCarouselProps) {
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
    const id = setInterval(() => go((idxRef.current + 1) % groups.length), 5000)
    return () => clearInterval(id)
  }, [paused, go, groups.length])

  const group = groups[idx]

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-12">
            {/* Left: Group Info */}
            <div className="flex flex-col justify-center">
              <div
                className="transition-all duration-300 ease-in-out"
                style={{
                  opacity: show ? 1 : 0,
                  transform: show ? 'translateX(0px)' : 'translateX(-20px)',
                }}
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">Nhóm Zalo</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{group.name}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{group.description}</p>

                <p className="mt-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {group.info}
                </p>

                <div className="mt-6">
                  <a
                    href={group.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all duration-200"
                  >
                    Tham gia nhóm <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Phone Screenshot */}
            <div
              className="flex items-center justify-center"
              style={{
                opacity: show ? 1 : 0,
                transform: show ? 'translateX(0px)' : 'translateX(20px)',
              }}
            >
              <div className="relative h-[400px] w-[224px] rounded-[28px] bg-slate-800 border-[8px] border-slate-700 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 h-6 w-32 rounded-b-2xl bg-slate-700" />
                {/* Screen content */}
                <div className={`absolute inset-[4px] top-8 rounded-[24px] overflow-hidden bg-linear-to-b ${group.screenshotBg}`}>
                  <div className="h-full flex flex-col p-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 rounded-full bg-white/30 border border-white/50" />
                      <div className="flex-1">
                        <div className="h-2 w-24 rounded-full bg-white/50" />
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex ${i === 2 ? 'justify-end' : ''}`}>
                          <div className={`h-3 rounded-full ${i === 2 ? 'bg-white/70 w-32' : 'bg-white/30 w-40'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-slate-600" />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-200 dark:bg-slate-800">
            <div
              key={idx}
              className="h-full origin-left bg-slate-900 dark:bg-white"
              style={{
                animation: 'review-progress 8s linear forwards',
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>
        </div>

        {/* Prev / Next buttons */}
        <button
          onClick={() => go((idxRef.current - 1 + groups.length) % groups.length)}
          aria-label="Nhóm trước"
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-12 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 hover:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >‹</button>
        <button
          onClick={() => go((idxRef.current + 1) % groups.length)}
          aria-label="Nhóm tiếp theo"
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:scale-110 hover:shadow-md transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >›</button>
      </div>

      {/* Dots indicator */}
      <div className="mt-8 flex items-center justify-center gap-3">
        {groups.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              i === idx
                ? 'w-8 bg-slate-900 dark:bg-white'
                : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600',
            )}
            aria-label={`Nhóm ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
