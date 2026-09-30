'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Users } from 'lucide-react'
import { Icons } from '@/assets/icons'
import { cn } from '@/lib/utils'

const SLIDE_MS = 6000

const navBtn =
  'flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:scale-110 hover:border-sky-400 hover:text-sky-600 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-sky-500 dark:hover:text-sky-300'

const chat = [
  { mine: false, w: 'w-40' },
  { mine: true,  w: 'w-28' },
  { mine: false, w: 'w-36' },
  { mine: false, w: 'w-24' },
  { mine: true,  w: 'w-32' },
]

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
    const id = setInterval(() => go((idxRef.current + 1) % groups.length), SLIDE_MS)
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30">
          {/* Tinted wash that follows the active group's colour */}
          <div aria-hidden className={cn('pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-linear-to-br opacity-20 blur-3xl transition-all duration-700', group.screenshotBg)} />

          <div className="relative grid grid-cols-1 gap-8 p-8 sm:p-12 md:grid-cols-2">
            {/* Left: Group Info */}
            <div className="flex flex-col justify-center">
              <div
                className="transition-all duration-300 ease-in-out"
                style={{
                  opacity: show ? 1 : 0,
                  transform: show ? 'translateX(0px)' : 'translateX(-20px)',
                }}
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                  <Icons.Zalo className="h-5 w-5" /> Nhóm Zalo
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{group.name}</h3>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <Users className="h-3.5 w-3.5" /> {group.description}
                </p>

                <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {group.info}
                </p>

                <a
                  href={group.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shimmer group mt-7 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-600/30"
                >
                  Tham gia nhóm <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            {/* Right: Phone Screenshot */}
            <div
              className="flex items-center justify-center transition-all duration-300 ease-in-out"
              style={{
                opacity: show ? 1 : 0,
                transform: show ? 'translateX(0px)' : 'translateX(20px)',
              }}
            >
              <div className="animate-float-slow">
                <div className="relative h-100 w-56 overflow-hidden rounded-[28px] border-8 border-slate-800 bg-slate-800 shadow-2xl shadow-sky-900/30 dark:border-slate-700">
                  <div className="absolute left-1/2 top-2 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-800 dark:bg-slate-700" />
                  <div className={cn('absolute inset-1 top-8 overflow-hidden rounded-[24px] bg-linear-to-b', group.screenshotBg)}>
                    <div className="flex h-full flex-col p-4">
                      <div className="mb-5 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full border border-white/50 bg-white/30" />
                        <div className="space-y-1">
                          <div className="h-2 w-24 rounded-full bg-white/60" />
                          <div className="h-1.5 w-14 rounded-full bg-white/35" />
                        </div>
                      </div>
                      {/* Messages pop in one by one each time the slide changes */}
                      <div key={idx} className="space-y-3">
                        {chat.map((m, i) => (
                          <div key={i} className={cn('flex animate-pop-in', m.mine && 'justify-end')} style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
                            <div className={cn('h-5 rounded-2xl', m.w, m.mine ? 'rounded-br-sm bg-white/80' : 'rounded-bl-sm bg-white/30')} />
                          </div>
                        ))}
                        {/* Typing indicator */}
                        <div className="flex animate-pop-in" style={{ animationDelay: `${0.3 + chat.length * 0.35}s` }}>
                          <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white/30 px-3 py-2">
                            {[0, 1, 2].map((d) => (
                              <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" style={{ animationDelay: `${d * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-slate-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100 dark:bg-slate-800">
            <div
              key={idx}
              className="h-full origin-left bg-linear-to-r from-sky-500 to-blue-600"
              style={{
                animation: `review-progress ${SLIDE_MS}ms linear forwards`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>
        </div>

        {/* Prev / Next buttons */}
        <button
          onClick={() => go((idxRef.current - 1 + groups.length) % groups.length)}
          aria-label="Nhóm trước"
          className={cn(navBtn, 'absolute left-0 top-1/2 hidden -translate-x-14 -translate-y-1/2 lg:flex')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go((idxRef.current + 1) % groups.length)}
          aria-label="Nhóm tiếp theo"
          className={cn(navBtn, 'absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-14 lg:flex')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="mt-8 flex items-center justify-center gap-3">
        {groups.map((g, i) => (
          <button
            key={g.id}
            onClick={() => go(i)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              i === idx
                ? 'w-8 bg-linear-to-r from-sky-500 to-blue-600'
                : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600',
            )}
            aria-label={`Nhóm ${i + 1}`}
            aria-current={i === idx}
          />
        ))}
      </div>
    </div>
  )
}
