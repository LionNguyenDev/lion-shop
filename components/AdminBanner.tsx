'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Moon, Sparkles } from 'lucide-react'

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

function MarqueeHalf({ mode, hidden }: { mode: Mode; hidden?: boolean }) {
  const Icon = mode === 'night' ? Moon : Sparkles
  const message = mode === 'night' ? NIGHT_MESSAGE : DAY_MESSAGE

  return (
    <div
      className="flex min-w-full shrink-0 items-center justify-around gap-16"
      aria-hidden={hidden}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold tracking-wide sm:text-base"
        >
          <Icon className="h-4 w-4 shrink-0 sm:h-4.5 sm:w-4.5" />
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

  const visible = (isAdmin || forced) && mode !== null

  useEffect(() => {
    document.documentElement.classList.toggle('has-admin-banner', visible)
    return () => document.documentElement.classList.remove('has-admin-banner')
  }, [visible])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-admin-banner fixed inset-x-0 top-0 z-[100] flex h-[var(--admin-banner-h)] items-center overflow-hidden border-b border-white/15 text-white shadow-md"
    >
      <div className="flex w-max animate-marquee will-change-transform">
        <MarqueeHalf mode={mode} />
        <MarqueeHalf mode={mode} hidden />
      </div>
    </div>
  )
}
