'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
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
} from './components'
import { contacts, reviews } from './const'

interface CurrentUser {
  id: string
  name: string
  username: string
  role: 'admin' | 'user'
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
    id: 'facebook', name: 'Facebook', icon: <i className="h-4 w-4">f</i>,
    handle: 'Lion Shop Cosmetics', stat: '1.2K người theo dõi',
    gradient: 'from-blue-600 to-blue-800',
    glow: 'hover:shadow-blue-500/30',
    href: 'https://www.facebook.com/ThuyLinhLion206',
    cta: 'Theo dõi Facebook',
    screen: 'facebook' as const,
  },
  {
    id: 'instagram', name: 'Instagram', icon: <i className="h-4 w-4">📸</i>,
    handle: '@lion.cosmetics', stat: '890 người theo dõi',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    glow: 'hover:shadow-pink-500/30',
    href: 'https://www.instagram.com/thuylinnlion/',
    cta: 'Theo dõi Instagram',
    screen: 'instagram' as const,
  },
  {
    id: 'zalo', name: 'Zalo', icon: <i className="h-4 w-4">💬</i>,
    handle: 'Lion Shop Beauty', stat: 'Hơn 10 nhóm chat cộng đồng',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'hover:shadow-sky-500/30',
    href: `https://zalo.me/0826223912`,
    cta: 'Kết bạn Zalo',
    screen: 'zalo' as const,
  },
  {
    id: 'threads', name: 'Threads', icon: <i className="h-4 w-4">🧵</i>,
    handle: '@lionbeauty', stat: '7K+ người theo dõi',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'hover:shadow-slate-500/20',
    href: 'https://www.threads.com/@thuylinnlion',
    cta: 'Theo dõi Threads',
    screen: 'threads' as const,
  },
]

export default function LandingPage() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [signingOut, setSigningOut] = useState(false)

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

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      window.location.href = '/landing'
    } catch (error) {
      setSigningOut(false)
    }
  }

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
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:bg-slate-900/95 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-12">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm">
              <span className="text-lg">🦁</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Lion Shop</p>
              <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">Cosmetic & Beauty</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={() => scrollTo(aboutRef)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Giới Thiệu</button>
            <button onClick={() => scrollTo(reviewsRef)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Đánh Giá</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-slate-900 dark:hover:text-white transition-colors">Liên Hệ</button>
          </div>

          {/* Auth CTA */}
          <div className="flex items-center gap-2">
            <ThemeToggleBtn />
            {user?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={buttonVariants() + ' bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'}
                >
                  <LayoutDashboard className="h-4 w-4" /> Manage Shop
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className={buttonVariants({ variant: 'ghost' }) + ' text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400'}
                >
                  Đăng xuất
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Hi, {user.name} 👋</span>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className={buttonVariants({ variant: 'ghost' }) + ' text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400'}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link href="/signin" className={buttonVariants({ variant: 'ghost' })}>Đăng nhập</Link>
                <Link
                  href="/signup"
                  className={buttonVariants() + ' bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'}
                >
                  <Sparkles className="h-4 w-4" /> Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          SECTIONS
      ══════════════════════════════════════════ */}
      <HeroSection scrollTo={scrollTo} aboutRef={aboutRef} contactRef={contactRef} />
      <StatsSection />
      <AboutSection aboutRef={aboutRef} />
      <ReviewSection reviews={reviews} reviewsRef={reviewsRef} />
      <ZaloGroupsSection groups={ZALO_GROUPS} />
      <SocialSection platforms={FOLLOW_PLATFORMS} contactRef={contactRef} />
      <Footer contacts={contacts} scrollTo={scrollTo} aboutRef={aboutRef} reviewsRef={reviewsRef} contactRef={contactRef} />

      {/* ══════════════════════════════════════════
          FLOATING CONTACT BUTTONS
      ══════════════════════════════════════════ */}
      <FloatingContactButtons />
    </div>
  )
}
