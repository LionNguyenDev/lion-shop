'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
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

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.1 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return isInView
}

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

export function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  /* smooth-scroll refs */
  const aboutRef   = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)
  const zaloRef    = useRef<HTMLDivElement>(null)
  const socialRef  = useRef<HTMLDivElement>(null)

  /* scroll animations */
  const statsInView = useInView(statsRef)
  const aboutInView = useInView(aboutRef)
  const reviewInView = useInView(reviewsRef)
  const zaloInView = useInView(zaloRef)
  const socialInView = useInView(socialRef)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



 
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-slate-950">

      {/* ── Background blobs (subtle) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-slate-200/20 dark:bg-slate-800/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-slate-200/15 dark:bg-slate-800/15 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-slate-200/20 dark:bg-slate-800/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200 bg-white/80 dark:bg-slate-900/80 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/50 backdrop-blur-lg'
          : 'border-slate-200/0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md'
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-900 to-slate-800 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
              <span className="text-lg">🦁</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Lion Shop</p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-500">Cosmetic & Beauty</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-8 text-sm font-medium">
            <button
              onClick={() => scrollTo(aboutRef)}
              className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-slate-900 dark:after:bg-white after:rounded-full hover:after:w-full after:transition-all after:duration-300"
            >
              Giới Thiệu
            </button>
            <button
              onClick={() => scrollTo(reviewsRef)}
              className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-slate-900 dark:after:bg-white after:rounded-full hover:after:w-full after:transition-all after:duration-300"
            >
              Đánh Giá
            </button>
            <button
              onClick={() => scrollTo(contactRef)}
              className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-slate-900 dark:after:bg-white after:rounded-full hover:after:w-full after:transition-all after:duration-300"
            >
              Liên Hệ
            </button>
          </div>

          {/* Right side: Theme toggle and Scroll indicator */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <ThemeToggleBtn />

            {/* Scroll indicator */}
            <div className={`hidden sm:flex transition-opacity duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
              <ChevronDown className="h-4 w-4 text-slate-400 animate-bounce" />
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SECTIONS
      ══════════════════════════════════════════ */}
      <div className="relative z-10">
        <HeroSection scrollTo={scrollTo} aboutRef={aboutRef} contactRef={contactRef} />
      </div>

      <div
        ref={statsRef}
        className={`relative z-10 transition-all duration-700 ${
          statsInView
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <StatsSection />
      </div>

      <div
        ref={aboutRef}
        className={`relative z-10 transition-all duration-700 ${
          aboutInView
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <AboutSection aboutRef={aboutRef} />
      </div>

      <div
        ref={reviewsRef}
        className={`relative z-10 transition-all duration-700 ${
          reviewInView
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <ReviewSection reviews={reviews} reviewsRef={reviewsRef} />
      </div>

      <div
        ref={zaloRef}
        className={`relative z-10 transition-all duration-700 ${
          zaloInView
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <ZaloGroupsSection groups={ZALO_GROUPS} />
      </div>

      <div
        ref={socialRef}
        className={`relative z-10 transition-all duration-700 ${
          socialInView
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <SocialSection platforms={FOLLOW_PLATFORMS} contactRef={contactRef} />
      </div>

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
