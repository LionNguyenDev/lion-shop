'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ExternalLink,
  Heart,
  LayoutDashboard,
  Package,
  Quote,
  Sparkles,
  Star,
  Tag,
  Users,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface CurrentUser {
  id: string
  name: string
  username: string
  role: 'admin' | 'user'
}

/* ─── Mock review data ─── */
const reviews = [
  {
    id: 1,
    name: 'Dương Thị Thuỳ Linh',
    avatar: '🌸',
    rating: 5,
    text: 'Shop quá xịn luôn! Hàng đẹp, giá rẻ mà ship nhanh nữa. Mình mua mấy lần rồi lần nào cũng ưng 💕',
    product: 'Áo thun basic',
    date: '20/05/2026',
  },
  {
    id: 2,
    name: 'Trần Minh Khôi',
    avatar: '🦋',
    rating: 5,
    text: 'Chất lượng vượt cả kỳ vọng, giá lại hợp lý. Nhân viên tư vấn nhiệt tình, đóng gói cẩn thận. Sẽ ủng hộ dài dài!',
    product: 'Quần jogger',
    date: '18/05/2026',
  },
  {
    id: 3,
    name: 'Lê Bảo Ngọc',
    avatar: '🌺',
    rating: 5,
    text: 'Đây là shop yêu thích của mình rồi ✨ Mỗi lần vào là mình lại muốn mua thêm. Hàng đẹp, giá phải chăng, ship cực nhanh!',
    product: 'Váy hoa nhí',
    date: '15/05/2026',
  },
  {
    id: 4,
    name: 'Phạm Gia Huy',
    avatar: '🎯',
    rating: 5,
    text: 'Mua làm quà tặng bạn gái, bạn ấy thích lắm! Hàng y hình, đóng gói đẹp có kèm thiệp nữa. Rất recommend!',
    product: 'Set quà tặng',
    date: '12/05/2026',
  },
  {
    id: 5,
    name: 'Vũ Khánh Ly',
    avatar: '🌙',
    rating: 5,
    text: 'Mình đã lo lắng vì mua online nhưng hàng thực tế còn đẹp hơn ảnh! Shop trả lời tin nhắn rất nhanh, nhiệt tình hỗ trợ 🙏',
    product: 'Túi tote canvas',
    date: '10/05/2026',
  },
  {
    id: 6,
    name: 'Đặng Thị Thu',
    avatar: '🍀',
    rating: 5,
    text: 'Giá siêu hạt dẻ mà chất không hề kém. Mình đã giới thiệu cho cả nhóm bạn rồi, ai cũng khen. Cảm ơn shop nhiều lắm!',
    product: 'Phụ kiện tóc',
    date: '08/05/2026',
  },
]

/* ─── Contact links ─── */
const contacts = [
  {
    name: 'Facebook',
    icon: '📘',
    handle: 'Lion Shop Official',
    href: 'https://facebook.com',
    color: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
  },
  {
    name: 'Threads',
    icon: '🧵',
    handle: '@lionshop',
    href: 'https://threads.net',
    color: 'from-slate-700 to-slate-900',
    shadow: 'shadow-slate-500/30',
  },
  {
    name: 'Zalo',
    icon: '💬',
    handle: '0901 234 567',
    href: 'https://zalo.me',
    color: 'from-sky-500 to-blue-500',
    shadow: 'shadow-sky-500/30',
  },
  {
    name: 'Instagram',
    icon: '📸',
    handle: '@lion.shop',
    href: 'https://instagram.com',
    color: 'from-pink-500 via-rose-500 to-orange-400',
    shadow: 'shadow-pink-500/30',
  },
]

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

export default function LandingPage() {
  const [user, setUser] = useState<CurrentUser | null>(null)

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
              <p className="mt-0.5 text-[10px] text-muted-foreground">Cute & Affordable</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo(aboutRef)}   className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => scrollTo(reviewsRef)} className="hover:text-foreground transition-colors">Reviews</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-foreground transition-colors">Contact</button>
          </div>

          {/* Auth CTA */}
          <div className="flex items-center gap-2">
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
                <Link href="/signin" className={buttonVariants({ variant: 'ghost' })}>Sign in</Link>
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
          ABOUT  (shop + owner)
      ══════════════════════════════════════════ */}
      <section ref={aboutRef} id="about" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20">
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className="animate-fade-up group rounded-3xl border bg-white/70 p-6 shadow-xl shadow-pink-500/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-white/5"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Quote className="mb-3 h-5 w-5 text-pink-300" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 text-lg border border-white/60 shadow-sm">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.product} · {r.date}</p>
                  </div>
                </div>
                <StarRow count={r.rating} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════ */}
      <section ref={contactRef} id="contact" className="relative z-10 mx-auto max-w-4xl px-6 pb-28 scroll-mt-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">Contact</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Liên hệ mua hàng 📲</h2>
          <p className="mt-2 text-sm text-muted-foreground">Nhắn tin cho mình qua bất kỳ kênh nào — mình trả lời cực nhanh!</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((c, i) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`animate-fade-up group flex items-center gap-4 rounded-2xl border bg-white/70 p-5 shadow-lg ${c.shadow} backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/5`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${c.color} text-2xl shadow-lg ${c.shadow}`}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.handle}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border bg-white/60 p-6 backdrop-blur-md dark:bg-white/5 text-center">
          <p className="text-2xl mb-2">🕐</p>
          <p className="font-semibold text-sm">Giờ hỗ trợ</p>
          <p className="text-sm text-muted-foreground mt-1">Thứ 2 – Chủ nhật · 8:00 – 22:00</p>
          <p className="text-xs text-muted-foreground mt-1">Thường trả lời trong vòng 15 phút ⚡</p>
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
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Cute & Affordable</p>
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
                <li><button onClick={() => scrollTo(contactRef)} className="hover:text-foreground transition-colors">Liên hệ</button></li>
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
            <p>© 2026 Lion Shop. Made with <Heart className="inline h-3 w-3 fill-pink-500 text-pink-500" /> in Việt Nam</p>
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
    </div>
  )
}
