'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ExternalLink,
  Heart,
  LayoutDashboard,
  Moon,
  Package,
  Quote,
  Sparkles,
  Star,
  Sun,
  Tag,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { contacts, reviews } from './const'

interface CurrentUser {
  id: string
  name: string
  username: string
  role: 'admin' | 'user'
}



/* ─── Small helpers ─── */
function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

/* ─── Count-up hook ─── */
function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setValue(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, started])
  return value
}

const STATS = [
  { value: 7,    suffix: '+', label: 'Năm kinh nghiệm', icon: '🏆',
    color: 'text-amber-400',  glowColor: 'rgba(251,191,36,0.5)',   sub: 'text-amber-400'  },
  { value: 4000, suffix: '+', label: 'Sản phẩm',        icon: '📦',
    color: 'text-violet-400', glowColor: 'rgba(167,139,250,0.5)',  sub: 'text-violet-400' },
  { value: 3,    suffix: '',  label: 'Kho toàn quốc',   icon: '🏭',
    color: 'text-pink-400',   glowColor: 'rgba(244,114,182,0.5)',  sub: 'text-pink-400'   },
  { value: 73,   suffix: '',  label: 'Tỉnh thành',      icon: '🗺️',
    color: 'text-sky-400',    glowColor: 'rgba(56,189,248,0.5)',   sub: 'text-sky-400'    },
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

/* ─── Review Carousel ─── */
function ReviewCarousel() {
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

  /* Auto-advance every 3s, pause on hover */
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => go((idxRef.current + 1) % reviews.length), 3000)
    return () => clearInterval(id)
  }, [paused, go])

  const r = reviews[idx]

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Main card ── */}
      <div className="relative mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl border bg-white/80 p-8 sm:p-12 shadow-2xl shadow-pink-500/10 backdrop-blur-md dark:bg-white/5">

          {/* Progress bar */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-pink-100/60 dark:bg-white/10">
            <div
              key={idx}
              className="h-full origin-left bg-linear-to-r from-violet-500 to-pink-500"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-500/10">
                <Quote className="h-5 w-5 text-pink-400" />
              </div>
              <StarRow count={r.rating} />
            </div>

            {/* Review text — min-height prevents layout shift */}
            <p className="text-base sm:text-lg leading-relaxed font-medium text-foreground min-h-[96px]">
              &ldquo;{r.text}&rdquo;
            </p>

            {/* Reviewer */}
            <div className="mt-8 flex items-center gap-3 border-t border-border/40 pt-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 text-xl shadow-md border border-white/60">
                {r.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.product} · {r.date}</p>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground/40 font-mono select-none">
                {idx + 1} / {reviews.length}
              </span>
            </div>
          </div>
        </div>

        {/* Prev / Next — desktop only (float outside the card) */}
        <button
          onClick={() => go((idxRef.current - 1 + reviews.length) % reviews.length)}
          aria-label="Đánh giá trước"
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 text-xl font-bold shadow-lg backdrop-blur-md dark:bg-slate-800/90 hover:scale-110 hover:shadow-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
        >‹</button>
        <button
          onClick={() => go((idxRef.current + 1) % reviews.length)}
          aria-label="Đánh giá tiếp theo"
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 text-xl font-bold shadow-lg backdrop-blur-md dark:bg-slate-800/90 hover:scale-110 hover:shadow-xl transition-all duration-200 text-muted-foreground hover:text-foreground"
        >›</button>
      </div>

      {/* ── Avatar dot strip (all screens) ── */}
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
                  ? 'border-pink-400 bg-linear-to-br from-violet-100 to-pink-100 dark:from-violet-900/40 dark:to-pink-900/40 shadow-lg shadow-pink-300/40'
                  : 'border-transparent bg-muted',
              )}
            >
              {rev.avatar}
            </div>
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all duration-300',
                i === idx ? 'bg-pink-400' : 'bg-transparent',
              )}
            />
          </button>
        ))}
      </div>

      {/* Prev / Next — mobile only (below dots) */}
      <div className="mt-5 flex sm:hidden items-center justify-center gap-4">
        <button
          onClick={() => go((idxRef.current - 1 + reviews.length) % reviews.length)}
          aria-label="Đánh giá trước"
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 text-lg font-bold shadow-md backdrop-blur-md dark:bg-slate-800/90 hover:scale-110 transition-all duration-200 text-muted-foreground"
        >‹</button>
        <button
          onClick={() => go((idxRef.current + 1) % reviews.length)}
          aria-label="Đánh giá tiếp theo"
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 text-lg font-bold shadow-md backdrop-blur-md dark:bg-slate-800/90 hover:scale-110 transition-all duration-200 text-muted-foreground"
        >›</button>
      </div>
    </div>
  )
}

/* ─── Dark / Light toggle ─── */
function ThemeToggleBtn() {
  const { setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(
        document.documentElement.classList.contains('dark') ? 'light' : 'dark'
      )}
      aria-label="Đổi giao diện"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white hover:scale-110 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 text-muted-foreground hover:text-foreground"
    >
      {/* CSS controls which icon shows — no JS state / no hydration mismatch */}
      <Sun  className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block  dark:hidden" />
    </button>
  )
}

/* ─── Social follow platforms data ───
   TODO: Replace the href values below with your actual social media URLs  */
const FOLLOW_PLATFORMS = [
  {
    id: 'facebook', name: 'Facebook', icon: '📘',
    handle: 'Lion Shop Cosmetics', stat: '1.2K người theo dõi',
    gradient: 'from-blue-600 to-blue-800',
    glow: 'hover:shadow-blue-500/30',
    href: 'https://facebook.com', /* TODO: replace with your Facebook page URL */
    cta: 'Theo dõi Facebook',
    screen: 'facebook' as const,
  },
  {
    id: 'instagram', name: 'Instagram', icon: '📸',
    handle: '@lion.cosmetics', stat: '890 người theo dõi',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    glow: 'hover:shadow-pink-500/30',
    href: 'https://instagram.com', /* TODO: replace with your Instagram URL */
    cta: 'Theo dõi Instagram',
    screen: 'instagram' as const,
  },
  {
    id: 'zalo', name: 'Zalo', icon: '💬',
    handle: 'Lion Shop Beauty', stat: '650 kết bạn',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'hover:shadow-sky-500/30',
    href: 'https://zalo.me', /* TODO: replace with your Zalo link e.g. https://zalo.me/0xxxxxxxxx */
    cta: 'Kết bạn Zalo',
    screen: 'zalo' as const,
  },
  {
    id: 'threads', name: 'Threads', icon: '🧵',
    handle: '@lionbeauty', stat: 'Sắp ra mắt',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'hover:shadow-slate-500/20',
    href: null as null,
    cta: null as null,
    screen: 'threads' as const,
  },
]

type PlatformScreen = typeof FOLLOW_PLATFORMS[number]['screen']

/* ─── Phone screenshot placeholder ───
   TODO: Replace the <div> inside each case below with a real screenshot:
         <img src="/screenshots/{platform}.png" alt="..." className="h-full w-full object-cover" />
   ─────────────────────────────────── */
function PhoneScreenContent({ type }: { type: PlatformScreen }) {
  if (type === 'instagram') return (
    <div className="h-full flex flex-col bg-linear-to-b from-pink-600 via-rose-500 to-orange-400">
      <div className="flex items-center gap-1.5 px-2 pt-3 pb-2 border-b border-white/20">
        <div className="h-5 w-5 shrink-0 rounded-full bg-white/40 border border-white/60" />
        <div className="h-1.5 flex-1 rounded-full bg-white/35" />
      </div>
      <div className="grid grid-cols-3 gap-px flex-1">
        {['bg-pink-300/60','bg-rose-400/60','bg-orange-300/60','bg-pink-400/60','bg-rose-300/60','bg-orange-400/60'].map((c, i) => (
          <div key={i} className={c} />
        ))}
      </div>
    </div>
  )

  if (type === 'facebook') return (
    <div className="h-full flex flex-col bg-linear-to-b from-blue-700 to-blue-500">
      <div className="h-14 bg-blue-400/40 relative shrink-0">
        <div className="absolute -bottom-3 left-3 h-8 w-8 rounded-full border-2 border-blue-600 bg-blue-300/50" />
      </div>
      <div className="pt-5 px-3 pb-2 space-y-1">
        <div className="h-2 w-20 rounded-full bg-white/55" />
        <div className="h-1.5 w-14 rounded-full bg-white/30" />
      </div>
      <div className="px-3 space-y-1">
        {[85, 70, 90].map((w, i) => (
          <div key={i} className="h-1 rounded-full bg-white/20" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mx-3 mt-2 flex-1 rounded bg-blue-400/30" />
    </div>
  )

  if (type === 'zalo') return (
    <div className="h-full flex flex-col bg-linear-to-b from-sky-600 to-sky-500 p-2 pt-3 gap-2">
      {[
        { mine: false, w: '70%' }, { mine: true,  w: '55%' },
        { mine: false, w: '80%' }, { mine: true,  w: '45%' },
        { mine: false, w: '65%' }, { mine: true,  w: '60%' },
      ].map((m, i) => (
        <div key={i} className={`flex ${m.mine ? 'justify-end' : ''}`}>
          <div
            className={`h-3 rounded-full ${m.mine ? 'bg-white/70' : 'bg-white/30'}`}
            style={{ width: m.w }}
          />
        </div>
      ))}
    </div>
  )

  /* threads */
  return (
    <div className="h-full flex flex-col bg-linear-to-b from-slate-800 to-slate-700 p-2 pt-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 shrink-0 rounded-full bg-white/25" />
            <div className="h-1.5 w-12 rounded-full bg-white/30" />
          </div>
          <div className="pl-5 space-y-0.5">
            <div className="h-1 w-full rounded-full bg-white/15" />
            <div className="h-1 w-3/4 rounded-full bg-white/15" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [statsStarted, setStatsStarted] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  /* smooth-scroll refs */
  const aboutRef   = useRef<HTMLElement>(null)
  const reviewsRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => {})
  }, [])

  /* Trigger count-up when stats banner scrolls into view */
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

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-linear-to-br from-violet-50 via-pink-50 to-amber-50 dark:from-slate-950 dark:via-violet-950 dark:to-slate-900">

      {/* ── Background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-300/40 dark:bg-violet-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-pink-300/40 dark:bg-pink-500/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-amber-300/40 dark:bg-amber-500/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/30 bg-white/70 backdrop-blur-xl dark:bg-slate-900/70 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-12">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
              <span className="text-lg">🦁</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Lion Shop</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Cosmetic & Beauty</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo(aboutRef)}   className="hover:text-foreground transition-colors">Giới Thiệu</button>
            <button onClick={() => scrollTo(reviewsRef)} className="hover:text-foreground transition-colors">Đánh Giá</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-foreground transition-colors">Liên Hệ</button>
          </div>

          {/* Auth CTA */}
          <div className="flex items-center gap-2">
            <ThemeToggleBtn />
            {user?.role === 'admin' ? (
              <Link
                href="/"
                className={buttonVariants() + ' bg-linear-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-violet-500/30'}
              >
                <LayoutDashboard className="h-4 w-4" /> Manage Shop
              </Link>
            ) : user ? (
              <span className="text-sm text-muted-foreground">Hi, {user.name} 👋</span>
            ) : (
              <>
                <Link href="/signin" className={buttonVariants({ variant: 'ghost' })}>Đăng nhập</Link>
                <Link
                  href="/signup"
                  className={buttonVariants() + ' bg-linear-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-violet-500/30'}
                >
                  <Sparkles className="h-4 w-4" /> Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-24 text-center sm:pt-24">
        <div className="animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 backdrop-blur-md dark:bg-white/5 dark:text-violet-300">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Hàng đẹp · Giá rẻ · Giao nhanh
          <Sparkles className="h-3 w-3 text-amber-500" />
        </div>

        <div className="animate-fade-up mb-2 text-6xl sm:text-7xl" style={{ animationDelay: '0.1s' }}>
          🦁<span className="inline-block animate-wave">👋</span>
        </div>

        <h1 className="animate-fade-up text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: '0.2s' }}>
          Xin chào!{' '}
          <span className="bg-linear-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            Chào mừng đến
          </span>
          <br />
          <span className="bg-linear-to-r from-amber-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">
            Lion Shop
          </span>{' '}
          ✨
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg" style={{ animationDelay: '0.3s' }}>
          Thiên đường mua sắm dễ thương — hàng ngàn sản phẩm chất lượng, giá cực hạt dẻ, phù hợp với tất cả mọi người 🧸
        </p>

        <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.4s' }}>
          <button onClick={() => scrollTo(aboutRef)}
            className={buttonVariants({ size: 'lg' }) + ' h-12 px-6 text-base bg-linear-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white shadow-xl shadow-violet-500/30 hover:scale-105 transition-all duration-200'}
          >
            <Sparkles className="h-4 w-4" /> Khám phá ngay
          </button>
          <button onClick={() => scrollTo(contactRef)}
            className={buttonVariants({ variant: 'outline', size: 'lg' }) + ' h-12 px-6 text-base bg-white/70 backdrop-blur-md hover:bg-white dark:bg-white/5 dark:hover:bg-white/10'}
          >
            Liên hệ mua hàng →
          </button>
        </div>

        {/* Trust strip */}
        <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground" style={{ animationDelay: '0.5s' }}>
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-500" /> 500+ khách hàng hài lòng</span>
          <span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-pink-500" /> 1000+ sản phẩm</span>
          <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-amber-500" /> Giá từ 29.000₫</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BANNER
      ══════════════════════════════════════════ */}
      <div ref={statsRef} className="relative z-10 w-full overflow-hidden">
        {/* Dark slab with gold border lines */}
        <div className="relative border-y-2 border-amber-500/60 py-10 sm:py-14">
          {/* Subtle gold glow behind */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5" />

          <div className="mx-auto max-w-5xl px-6">
            {/* Divider lines like the reference */}
            <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-amber-500/30">
              {STATS.map((stat) => (
                <StatItem key={stat.label} stat={stat} started={statsStarted} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ABOUT  (shop + owner)
      ══════════════════════════════════════════ */}
      <section ref={aboutRef} id="about" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20 mt-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">About us</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Về Lion Shop 🦁</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* About the shop */}
          <div className="animate-fade-up rounded-3xl border bg-white/70 p-8 shadow-xl shadow-violet-500/10 backdrop-blur-md dark:bg-white/5">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-400 to-violet-600 text-white shadow-lg shadow-violet-400/40 text-2xl">
              🏪
            </div>
            <h3 className="text-xl font-bold mb-3">Câu chuyện của chúng mình</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Lion Shop ra đời từ niềm đam mê với thời trang và phụ kiện dễ thương. Chúng mình tin rằng ai cũng xứng đáng được mặc đẹp mà không cần chi quá nhiều tiền 💜
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Với hơn <strong className="text-foreground">1.000 sản phẩm</strong> trải dài từ thời trang, phụ kiện đến đồ gia dụng cute, Lion Shop luôn cập nhật xu hướng mới nhất để bạn luôn trendy với mức giá siêu hạt dẻ — bắt đầu chỉ từ <strong className="text-foreground">29.000₫</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mỗi đơn hàng đều được đóng gói cẩn thận, giao nhanh toàn quốc trong 1–3 ngày. Chúng mình luôn sẵn sàng hỗ trợ bạn 24/7 qua các kênh mạng xã hội 🚀
            </p>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { value: '1K+', label: 'Sản phẩm', icon: '📦' },
                { value: '500+', label: 'Khách hàng', icon: '🥰' },
                { value: '4.9★', label: 'Đánh giá', icon: '⭐' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-violet-50 dark:bg-white/5 p-3 text-center">
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-base font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="mt-5 space-y-2">
              {[
                '✅ Hàng ngàn sản phẩm, đa dạng mọi nhu cầu',
                '✅ Giá cả phải chăng — phù hợp mọi túi tiền',
                '✅ Giao hàng nhanh toàn quốc 1–3 ngày',
                '✅ Đổi trả dễ dàng trong 7 ngày',
                '✅ Hỗ trợ khách hàng 24/7',
              ].map((f) => (
                <p key={f} className="text-sm text-muted-foreground">{f}</p>
              ))}
            </div>
          </div>

          {/* About the owner */}
          <div className="animate-fade-up rounded-3xl border bg-white/70 p-8 shadow-xl shadow-pink-500/10 backdrop-blur-md dark:bg-white/5" style={{ animationDelay: '0.15s' }}>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-pink-400 to-pink-600 text-white shadow-lg shadow-pink-400/40 text-2xl">
              👩
            </div>
            <h3 className="text-xl font-bold mb-4">Chủ Lion Shop</h3>

            {/* Owner card */}
            <div className="flex items-start gap-4 mb-5">
              {/* Placeholder avatar */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-2xl bg-linear-to-br from-pink-200 to-violet-200 dark:from-pink-900/40 dark:to-violet-900/40 flex items-center justify-center text-4xl shadow-lg border-2 border-white/60">
                  🦁
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-400 border-2 border-white shadow-sm" />
              </div>
              <div>
                <p className="font-bold text-base">Dương Thị Thuỳ Linh</p>
                <p className="text-xs text-muted-foreground mt-0.5">Owner · 23 tuổi</p>
                <p className="text-xs text-muted-foreground">📍 Quảng Trị</p>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">Fashion lover</span>
                  <span className="rounded-full bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] font-medium text-pink-600 dark:text-pink-400">Dreamer ✨</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Mình là Linh — một cô gái 22 tuổi yêu thích thời trang và luôn muốn mọi người xung quanh được mặc đẹp với giá cả hợp lý nhất 🌸
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Lion Shop được mình bắt đầu từ một góc nhỏ trong phòng ngủ, với chiếc điện thoại và niềm đam mê cháy bỏng. Giờ đây shop đã phục vụ hơn 500 khách hàng thân thiết trên khắp Việt Nam 🇻🇳
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mình luôn chọn lọc kỹ càng từng sản phẩm để đảm bảo bạn nhận được điều tốt nhất. Mỗi đơn hàng không chỉ là một giao dịch — đó là một nụ cười mình muốn gửi đến bạn 💕
            </p>

            <div className="mt-5 rounded-2xl bg-pink-50 dark:bg-white/5 p-4 border border-pink-100 dark:border-white/10">
              <p className="text-xs italic text-muted-foreground">
                &ldquo;Mình muốn Lion Shop là nơi bất kỳ ai cũng tìm được thứ mình thích, với mức giá mà ai cũng có thể vui vẻ mua 🎀&rdquo;
              </p>
              <p className="mt-2 text-xs font-semibold text-pink-600 dark:text-pink-400">— Dương Thị Thuỳ Linh</p>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground/60 italic">
              * Hình ảnh chủ shop sẽ được cập nhật sớm 📷
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CUSTOMER REVIEWS
      ══════════════════════════════════════════ */}
      <section ref={reviewsRef} id="reviews" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-pink-500">Reviews</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Khách hàng nói gì? 💬</h2>
          <p className="mt-2 text-sm text-muted-foreground">Hơn 500 đánh giá 5 sao từ khách hàng thân thiết</p>

          {/* Overall rating */}
          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border bg-white/70 px-5 py-3 shadow-lg backdrop-blur-md dark:bg-white/5">
            <span className="text-3xl font-black">4.9</span>
            <div>
              <StarRow />
              <p className="mt-0.5 text-xs text-muted-foreground">dựa trên 500+ đánh giá</p>
            </div>
          </div>
        </div>

        <ReviewCarousel />
      </section>

      {/* ══════════════════════════════════════════
          THEO DÕI SHOP Ở ĐÂU
      ══════════════════════════════════════════ */}
      <section ref={contactRef} id="contact" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Follow us</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Theo dõi Shop ở đâu 📲</h2>
          <p className="mt-2 text-sm text-muted-foreground">Follow để cập nhật hàng mới và ưu đãi hot mỗi ngày!</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FOLLOW_PLATFORMS.map((p, i) => (
            <div
              key={p.id}
              className={`animate-fade-up group flex flex-col items-center rounded-3xl border bg-white/70 p-6 shadow-xl ${p.glow} backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-white/5`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Platform badge */}
              <div className={`mb-5 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r ${p.gradient} px-3 py-1.5 text-xs font-bold text-white shadow-lg`}>
                {p.icon} {p.name}
              </div>

              {/* ── Phone mockup ──
                  TODO: Replace <PhoneScreenContent> with a real screenshot image:
                  <img src="/screenshots/{p.id}.png" alt={p.name} className="h-full w-full object-cover" />
              ── */}
              <div className="relative mb-5">
                <div className="relative h-[192px] w-[108px] rounded-[22px] bg-slate-800 border-[3px] border-slate-700 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-[6px] left-1/2 -translate-x-1/2 z-10 h-[5px] w-[28px] rounded-full bg-slate-700" />
                  {/* Screen content */}
                  <div className="absolute inset-[3px] top-[13px] bottom-[10px] rounded-[17px] overflow-hidden">
                    <PhoneScreenContent type={p.screen} />
                  </div>
                  {/* Home indicator */}
                  <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 h-[2.5px] w-[26px] rounded-full bg-slate-600" />
                </div>
                {/* Glow underneath phone */}
                <div className={`pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-linear-to-r ${p.gradient} opacity-40 blur-xl`} />
              </div>

              {/* Info */}
              <p className="font-bold text-sm text-center">{p.handle}</p>
              <p className="mt-0.5 mb-5 text-xs text-muted-foreground text-center">{p.stat}</p>

              {/* CTA */}
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto inline-flex items-center gap-1.5 rounded-full bg-linear-to-r ${p.gradient} px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 hover:scale-105 transition-all duration-200`}
                >
                  {p.cta} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="mt-auto inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 dark:border-white/20 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  🚧 Sắp có
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/30 bg-white/50 backdrop-blur-xl dark:bg-slate-900/50 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
          <div className="grid gap-10 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
                  <span className="text-lg">🦁</span>
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">Lion Shop</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Cosmetic & Beauty</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thiên đường mua sắm dễ thương của bạn. Hàng đẹp, giá rẻ, giao nhanh 💕
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Khám phá</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button onClick={() => scrollTo(aboutRef)}   className="hover:text-foreground transition-colors">Về chúng mình</button></li>
                <li><button onClick={() => scrollTo(reviewsRef)} className="hover:text-foreground transition-colors">Đánh giá khách hàng</button></li>
                <li><button onClick={() => scrollTo(contactRef)} className="hover:text-foreground transition-colors">Theo dõi Shop</button></li>
                <li><Link href="/signin" className="hover:text-foreground transition-colors">Đăng nhập</Link></li>
              </ul>
            </div>

            {/* Social quick */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Mạng xã hội</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {contacts.map((c) => (
                  <li key={c.name}>
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                      <span>{c.icon}</span> {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/30 dark:border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© 2026 Lion Shop <Heart className="inline h-3 w-3 fill-pink-500 text-pink-500" /> Dev: LuuG </p>
            <p className="flex items-center gap-3">
              <span>Chính sách bảo mật</span>
              <span>·</span>
              <span>Điều khoản sử dụng</span>
              <span>·</span>
              <span className="text-violet-500">🦁 Lion Shop</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════
          FLOATING CONTACT BUTTONS (fixed bottom-right)
          Messenger + Zalo — hover to see label, click to open chat
      ══════════════════════════════════════════ */}
      {/* TODO: Replace the two href values below with your actual links */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* ── Zalo ──
            TODO: replace href ↓ with your Zalo link (e.g. https://zalo.me/0xxxxxxxxx) */}
        <div className="group flex items-center gap-3">
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm dark:bg-slate-800 opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
            Nhắn Zalo 💙
          </span>
          <div className="relative">
            <span className="absolute inset-0 rounded-full animate-ping bg-sky-400/40" />
            <a
              href="/* TODO: https://zalo.me/0xxxxxxxxx */"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nhắn Zalo"
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-blue-600 border-2 border-white/20 text-white text-2xl font-black italic shadow-xl shadow-sky-500/40 hover:scale-110 transition-transform duration-200"
            >
              Z
            </a>
          </div>
        </div>

        {/* ── Messenger ──
            TODO: replace href ↓ with your Messenger link (e.g. https://m.me/your.page.name) */}
        <div className="group flex items-center gap-3">
          <span className="pointer-events-none select-none whitespace-nowrap rounded-full border border-white/10 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm dark:bg-slate-800 opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
            Nhắn Messenger 💬
          </span>
          <div className="relative">
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/40" style={{ animationDelay: '0.7s' }} />
            <a
              href="/* TODO: https://m.me/your.page.name */"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nhắn Messenger"
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-violet-600 border-2 border-white/20 text-white text-2xl font-black shadow-xl shadow-blue-500/40 hover:scale-110 transition-transform duration-200"
            >
              M
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
