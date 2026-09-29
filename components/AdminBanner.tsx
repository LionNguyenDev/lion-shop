'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Moon, Pause, Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Khung giờ "đêm khuya": 23:30 → 05:00 (giờ máy người dùng) */
const NIGHT_START_MINUTES = 23 * 60 + 30
const NIGHT_END_MINUTES = 5 * 60

const NIGHT_MESSAGE = 'Tôi Nguyễn Danh Lưu xin thông báo, đã tối muộn rồi, ĐỀ NGHỊ BÀ DƯƠNG THỊ THUỲ LINH ĐI NGỦ GẤP'
const DAY_MESSAGE = 'MỖI NGÀY CỐ GẮNG MỘT ÍT - CHÚC BÀ CHỦ DƯƠNG THỊ THUỲ LINH MUA MAY BÁN ĐẮT NHÉ'

type Mode = 'night' | 'day'

function currentMode(now: Date): Mode {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes >= NIGHT_START_MINUTES || minutes < NIGHT_END_MINUTES ? 'night' : 'day'
}

function MarqueeHalf({ mode }: { mode: Mode }) {
  const Icon = mode === 'night' ? Moon : Sparkles
  const message = mode === 'night' ? NIGHT_MESSAGE : DAY_MESSAGE

  return (
    <div className="flex min-w-full shrink-0 items-center justify-around gap-14">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flex items-center gap-3 whitespace-nowrap text-sm font-semibold tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] sm:text-[0.95rem]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {message}
        </span>
      ))}
    </div>
  )
}

export function AdminBanner() {
  const pathname = usePathname()
  const [mode, setMode] = useState<Mode | null>(null)
  // ?banner=night | day | preview → xem thử ở bất kỳ trang nào, không cần đợi đúng giờ
  const [forced, setForced] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const isAdmin = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('banner')
    setForced(param === 'night' || param === 'day' || param === 'preview')
    const tick = () =>
      setMode(param === 'night' || param === 'day' ? param : currentMode(new Date()))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  // With reduced motion the text can't scroll, so it's shown as a single static line
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const visible = (isAdmin || forced) && mode !== null

  useEffect(() => {
    document.documentElement.classList.toggle('has-admin-banner', visible)
    return () => document.documentElement.classList.remove('has-admin-banner')
  }, [visible])

  if (!visible) return null

  const message = mode === 'night' ? NIGHT_MESSAGE : DAY_MESSAGE
  const Icon    = mode === 'night' ? Moon : Sparkles

  return (
    <div
      className={cn(
        'marquee-track fixed inset-x-0 top-0 z-[100] flex h-[var(--admin-banner-h)] items-center overflow-hidden',
        'border-b border-white/10 text-white shadow-sm',
        mode === 'night' ? 'bg-admin-banner-night' : 'bg-admin-banner-day',
      )}
    >
      {/* Screen readers get the message once; the scrolling copies are decorative */}
      <p role="status" className="sr-only">{message}</p>

      {reducedMotion ? (
        <p aria-hidden="true" className="flex w-full items-center justify-center gap-3 truncate px-4 text-sm font-semibold tracking-wide">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{message}</span>
        </p>
      ) : (
        <>
          <div aria-hidden="true" className="marquee-mask flex-1 overflow-hidden">
            <div className="flex w-max animate-marquee will-change-transform" data-paused={paused}>
              <MarqueeHalf mode={mode} />
              <MarqueeHalf mode={mode} />
            </div>
          </div>

          {/* Moving content needs a stop control; it also pauses on hover and on keyboard focus */}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Chạy lại dòng chữ' : 'Dừng dòng chữ'}
            title={paused ? 'Chạy lại dòng chữ' : 'Dừng dòng chữ'}
            className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </div>
  )
}
