'use client'

import { ArrowRight, Droplets, Hand, MessageCircle, Package, Palette, Sparkles, Star, Tag, Truck, Users } from 'lucide-react'
import { Icons } from '@/assets/icons'

interface HeroSectionProps {
  scrollTo: (ref: React.RefObject<HTMLElement | null>) => void
  aboutRef: React.RefObject<HTMLElement | null>
  contactRef: React.RefObject<HTMLElement | null>
}

const floatCard =
  'rounded-2xl border border-white/70 bg-white/80 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/40'

/** Decorative showcase: lion on an orbit with floating product cards */
function HeroStage() {
  return (
    <div aria-hidden className="relative mx-auto h-88 w-full max-w-md sm:h-104">
      {/* Glow disc */}
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-emerald-300/50 via-teal-200/40 to-amber-200/50 blur-2xl dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-amber-500/15" />

      {/* Orbits */}
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-emerald-400/40 animate-spin-slow sm:h-80 sm:w-80">
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_12px_var(--color-emerald-400)]" />
        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-400" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/30 animate-spin-slow [animation-direction:reverse]">
        <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400" />
      </div>

      {/* Lion */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/30 animate-pulse-ring" />
        <div className="animate-pop-in">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] bg-white/70 ring-1 ring-emerald-200 shadow-2xl shadow-emerald-500/20 backdrop-blur animate-float-slow dark:bg-slate-900/60 dark:ring-emerald-500/30">
            <Icons.Lion className="h-28 w-28 drop-shadow-[0_10px_18px_rgb(0_0_0/0.18)]" />
          </div>
        </div>
      </div>

      {/* Product card */}
      <div className="absolute left-0 top-4 animate-pop-in" style={{ animationDelay: '0.4s' }}>
        <div className={`${floatCard} flex items-center gap-3 animate-float-tilt`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300"><Palette className="h-5 w-5" /></span>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Son tint</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">129.000₫</p>
          </div>
        </div>
      </div>

      {/* Rating card */}
      <div className="absolute right-0 top-16 animate-pop-in" style={{ animationDelay: '0.6s' }}>
        <div className={`${floatCard} animate-float-slower`}>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="mt-1 text-left text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">4.9</span> · 500+ đánh giá
          </p>
        </div>
      </div>

      {/* Serum card */}
      <div className="absolute bottom-10 right-2 animate-pop-in" style={{ animationDelay: '0.8s' }}>
        <div className={`${floatCard} flex items-center gap-3 animate-float-slow`} style={{ animationDelay: '1.2s' }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"><Droplets className="h-5 w-5" /></span>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Serum dưỡng da</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Còn hàng · Freeship</p>
          </div>
        </div>
      </div>

      {/* Delivery chip */}
      <div className="absolute bottom-4 left-4 animate-pop-in" style={{ animationDelay: '1s' }}>
        <div className={`${floatCard} flex items-center gap-2 rounded-full py-2 animate-float-tilt`} style={{ animationDelay: '0.6s' }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Giao 1–3 ngày</span>
        </div>
      </div>
    </div>
  )
}

export function HeroSection({ scrollTo, aboutRef, contactRef }: HeroSectionProps) {
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-6 lg:px-12 lg:pb-28">
      <div className="text-center lg:text-left">
        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Hàng đẹp · Giá rẻ · Giao nhanh
        </div>

        <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white" style={{ animationDelay: '0.1s' }}>
          Xin chào!{' '}
          <Hand className="inline-block h-[0.85em] w-[0.85em] -mt-2 text-amber-500 animate-wave" />
          <br />
          Chào mừng đến{' '}
          <span className="relative whitespace-nowrap">
            <span className="bg-linear-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent bg-gradient-animated dark:from-emerald-300 dark:via-teal-200 dark:to-amber-200">
              Lion Shop
            </span>
            {/* Hand-drawn underline */}
            <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-amber-400">
              <path d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-draw" />
            </svg>
          </span>{' '}
          <Sparkles className="inline-block h-[0.7em] w-[0.7em] -mt-4 text-amber-400 animate-float-tilt" />
        </h1>

        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-slate-600 sm:text-lg lg:mx-0 dark:text-slate-400" style={{ animationDelay: '0.2s' }}>
          Thiên đường mua sắm dễ thương — hàng ngàn sản phẩm chất lượng, giá cực hạt dẻ, phù hợp với tất cả mọi người.
        </p>

        <div className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => scrollTo(aboutRef)}
            className="btn-shimmer group inline-flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-gradient-animated px-6 text-base font-semibold text-white shadow-lg shadow-emerald-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/30 active:translate-y-0"
          >
            <Sparkles className="h-4 w-4" /> Khám phá ngay
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => scrollTo(contactRef)}
            className="group inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 text-base font-semibold text-slate-800 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
          >
            <MessageCircle className="h-4 w-4 transition-transform group-hover:-rotate-12" /> Liên hệ mua hàng
          </button>
        </div>

        {/* Trust strip */}
        <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-2 lg:justify-start" style={{ animationDelay: '0.4s' }}>
          {[
            { icon: Users,   text: '500+ khách hàng hài lòng' },
            { icon: Package, text: '1000+ sản phẩm' },
            { icon: Tag,     text: 'Giá từ 29.000₫' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur transition-colors hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {text}
            </span>
          ))}
        </div>
      </div>

      <HeroStage />
    </section>
  )
}
