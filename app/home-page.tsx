'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogIn } from 'lucide-react'
import {
  Reveal,
  HeroSection,
  StatsSection,
  AboutSection,
  ReviewSection,
  ZaloGroupsSection,
  SocialSection,
  Footer,
  FloatingContactButtons,
  ThemeToggleBtn,
} from '@/app/home/components'
import { contacts, reviews } from '@/app/home/const'
import { Icons } from '@/assets/icons'

const ZALO_GROUPS = [
  {
    id: 1,
    name: 'Lion Shop - Khách hàng',
    description: '500+ thành viên',
    members: '500+',
    info: 'Cộng đồng khách hàng chính của Lion Shop. Nhận tin tức sản phẩm mới, ưu đãi độc quyền và hỗ trợ trực tiếp từ shop.',
    screenshotBg: 'from-sky-500 to-blue-600',
    link: 'https://zalo.me/g/groups',
  },
  {
    id: 2,
    name: 'Lion Shop - Deal Hot',
    description: '300+ thành viên',
    members: '300+',
    info: 'Nhóm chia sẻ các deal hot, sản phẩm giảm giá và flash sale. Cập nhật liên tục 24/7.',
    screenshotBg: 'from-violet-500 to-purple-600',
    link: 'https://zalo.me/g/groups',
  },
  {
    id: 3,
    name: 'Lion Shop - Feedback',
    description: '150+ thành viên',
    members: '150+',
    info: 'Nhóm nhận feedback từ khách hàng. Giúp chúng tôi cải thiện dịch vụ và sản phẩm tốt hơn.',
    screenshotBg: 'from-pink-500 to-rose-600',
    link: 'https://zalo.me/g/groups',
  },
]

const FOLLOW_PLATFORMS = [
  {
    id: 'facebook', name: 'Facebook', icon: <Icons.Facebook className="h-4 w-4" />,
    handle: 'Lion Shop Cosmetics', stat: '1.2K người theo dõi',
    gradient: 'from-blue-600 to-blue-800',
    glow: 'hover:shadow-blue-500/30',
    href: 'https://www.facebook.com/ThuyLinhLion206',
    cta: 'Theo dõi Facebook',
    screen: 'facebook' as const,
  },
  {
    id: 'instagram', name: 'Instagram', icon: <Icons.Instagram className="h-4 w-4" />,
    handle: '@lion.cosmetics', stat: '890 người theo dõi',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    glow: 'hover:shadow-pink-500/30',
    href: 'https://www.instagram.com/thuylinnlion/',
    cta: 'Theo dõi Instagram',
    screen: 'instagram' as const,
  },
  {
    id: 'zalo', name: 'Zalo', icon: <Icons.Zalo className="h-4 w-4" />,
    handle: 'Lion Shop Beauty', stat: 'Hơn 10 nhóm chat cộng đồng',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'hover:shadow-sky-500/30',
    href: `https://zalo.me/0826223912`,
    cta: 'Kết bạn Zalo',
    screen: 'zalo' as const,
  },
  {
    id: 'threads', name: 'Threads', icon: <Icons.Threads className="h-4 w-4" />,
    handle: '@lionbeauty', stat: '7K+ người theo dõi',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'hover:shadow-slate-500/20',
    href: 'https://www.threads.com/@thuylinnlion',
    cta: 'Theo dõi Threads',
    screen: 'threads' as const,
  },
]

const navLinkClass =
  'relative py-1 text-slate-600 transition-colors duration-200 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-linear-to-r after:from-emerald-500 after:to-teal-400 after:transition-transform after:duration-300 hover:after:scale-x-100'

export function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  /* smooth-scroll refs */
  const aboutRef   = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(window.scrollY > 10)
      setProgress(max > 0 ? window.scrollY / max : 0)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-slate-950">

      {/* ── Background colour mesh ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-112 w-112 rounded-full bg-emerald-200/40 blur-3xl animate-blob dark:bg-emerald-500/10" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl animate-blob dark:bg-amber-500/10" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl animate-blob dark:bg-teal-500/10" style={{ animationDelay: '8s' }} />
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200 bg-white/80 shadow-lg shadow-slate-200/30 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/30'
          : 'border-transparent bg-transparent'
      }`}>
        {/* Scroll progress */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-emerald-500 via-teal-400 to-amber-400"
          style={{ transform: `scaleX(${progress})` }}
        />

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-12 sm:py-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-100 to-amber-100 ring-1 ring-emerald-200 shadow-sm transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 dark:from-emerald-500/20 dark:to-amber-500/10 dark:ring-emerald-500/30">
              <Icons.Lion className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">Lion Shop</p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">Cosmetic & Beauty</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <button onClick={() => scrollTo(aboutRef)} className={navLinkClass}>Giới Thiệu</button>
            <button onClick={() => scrollTo(reviewsRef)} className={navLinkClass}>Đánh Giá</button>
            <button onClick={() => scrollTo(contactRef)} className={navLinkClass}>Liên Hệ</button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleBtn />
            <Link
              href="/signin"
              className="btn-shimmer inline-flex h-9 items-center gap-1.5 rounded-lg bg-linear-to-r from-emerald-700 to-teal-700 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-700/30"
            >
              <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SECTIONS
      ══════════════════════════════════════════ */}
      <div className="relative z-10">
        <HeroSection scrollTo={scrollTo} aboutRef={aboutRef} contactRef={contactRef} />
      </div>

      <Reveal><StatsSection /></Reveal>
      <Reveal><AboutSection aboutRef={aboutRef} /></Reveal>
      <Reveal><ReviewSection reviews={reviews} reviewsRef={reviewsRef} /></Reveal>
      <Reveal><ZaloGroupsSection groups={ZALO_GROUPS} /></Reveal>
      <Reveal><SocialSection platforms={FOLLOW_PLATFORMS} contactRef={contactRef} /></Reveal>

      <div className="relative z-10">
        <Footer contacts={contacts} scrollTo={scrollTo} aboutRef={aboutRef} reviewsRef={reviewsRef} contactRef={contactRef} />
      </div>

      {/* ══════════════════════════════════════════
          FLOATING CONTACT BUTTONS
      ══════════════════════════════════════════ */}
      <FloatingContactButtons />
    </div>
  )
}
