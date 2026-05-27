'use client'

import Link from 'next/link'
import { Sparkles, Users, Package, Tag } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface HeroSectionProps {
  scrollTo: (ref: React.RefObject<HTMLElement | null>) => void
  aboutRef: React.RefObject<HTMLElement | null>
  contactRef: React.RefObject<HTMLElement | null>
}

export function HeroSection({ scrollTo, aboutRef, contactRef }: HeroSectionProps) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-24 text-center sm:pt-24">
      <div className="animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
        <Sparkles className="h-3 w-3 text-slate-500" />
        Hàng đẹp · Giá rẻ · Giao nhanh
        <Sparkles className="h-3 w-3 text-slate-500" />
      </div>

      <div className="animate-fade-up mb-2 text-6xl sm:text-7xl" style={{ animationDelay: '0.1s' }}>
        🦁<span className="inline-block animate-wave">👋</span>
      </div>

      <h1 className="animate-fade-up text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl text-slate-900 dark:text-white" style={{ animationDelay: '0.2s' }}>
        Xin chào!{' '}
        <span className="text-slate-700 dark:text-slate-200">
          Chào mừng đến
        </span>
        <br />
        <span className="text-slate-900 dark:text-white">
          Lion Shop
        </span>{' '}
        ✨
      </h1>

      <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg" style={{ animationDelay: '0.3s' }}>
        Thiên đường mua sắm dễ thương — hàng ngàn sản phẩm chất lượng, giá cực hạt dẻ, phù hợp với tất cả mọi người 🧸
      </p>

      <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.4s' }}>
        <button onClick={() => scrollTo(aboutRef)}
          className={buttonVariants({ size: 'lg' }) + ' h-12 px-6 text-base bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:scale-105 transition-all duration-200'}
        >
          <Sparkles className="h-4 w-4" /> Khám phá ngay
        </button>
        <button onClick={() => scrollTo(contactRef)}
          className={buttonVariants({ variant: 'outline', size: 'lg' }) + ' h-12 px-6 text-base border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'}
        >
          Liên hệ mua hàng →
        </button>
      </div>

      {/* Trust strip */}
      <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400" style={{ animationDelay: '0.5s' }}>
        <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" /> 500+ khách hàng hài lòng</span>
        <span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" /> 1000+ sản phẩm</span>
        <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" /> Giá từ 29.000₫</span>
      </div>
    </section>
  )
}
