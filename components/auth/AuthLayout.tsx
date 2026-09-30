import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShoppingCart, TrendingUp, Truck } from 'lucide-react'
import { Icons } from '@/assets/icons'
import { ThemeToggleBtn } from '@/app/home/components/ThemeToggle'

const highlights = [
  'Theo dõi đơn hàng và trạng thái giao hàng theo thời gian thực',
  'Quản lý sản phẩm, tồn kho và khách hàng ở một nơi',
  'Báo cáo doanh thu rõ ràng, dễ đọc mỗi ngày',
]

const bars = [40, 65, 50, 85, 70, 100]

const floatCard =
  'rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-md'

/** Decorative dashboard preview: lion badge on an orbit, with floating stat cards */
function BrandStage() {
  return (
    <div aria-hidden className="relative mx-auto h-80 w-full max-w-md">
      {/* Orbit + pulse behind the lion */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15 animate-spin-slow">
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_var(--color-emerald-400)]" />
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-300" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/30 animate-pulse-ring" />
        <div className="animate-pop-in">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-linear-to-br from-emerald-400/30 via-teal-500/15 to-transparent ring-1 ring-white/20 backdrop-blur animate-float-slow">
            <Icons.Lion className="h-20 w-20 drop-shadow-[0_8px_16px_rgb(0_0_0/0.35)]" />
          </div>
        </div>
      </div>

      {/* New orders */}
      <div className="absolute left-0 top-2 animate-pop-in" style={{ animationDelay: '0.35s' }}>
        <div className={`${floatCard} flex items-center gap-3 animate-float-tilt`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] text-slate-400">Đơn hàng mới</p>
            <p className="text-lg font-bold leading-tight">+24</p>
          </div>
        </div>
      </div>

      {/* Revenue with live bars */}
      <div className="absolute right-0 top-20 animate-pop-in" style={{ animationDelay: '0.55s' }}>
        <div className={`${floatCard} w-44 animate-float-slower`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400">Doanh thu</p>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-300">
              <TrendingUp className="h-3 w-3" /> 18%
            </span>
          </div>
          <div className="mt-2 flex h-12 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-linear-to-t from-emerald-500 to-teal-300 animate-bar-rise"
                style={{ height: `${h}%`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Delivery rate */}
      <div className="absolute bottom-2 left-6 animate-pop-in" style={{ animationDelay: '0.75s' }}>
        <div className={`${floatCard} w-48 animate-float-slow`} style={{ animationDelay: '1s' }}>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-300" />
            <p className="text-[11px] text-slate-400">Giao thành công</p>
            <p className="ml-auto text-sm font-bold">98%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[98%] rounded-full bg-linear-to-r from-amber-300 to-emerald-400 bg-gradient-animated" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface AuthLayoutProps {
  title: React.ReactNode
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-slate-950 text-slate-50 lg:flex lg:flex-col lg:justify-between lg:gap-8 lg:p-12">
        {/* Moving colour mesh */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-112 w-112 rounded-full bg-emerald-500/25 blur-3xl animate-blob" />
          <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
          <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl animate-blob" style={{ animationDelay: '8s' }} />
        </div>
        {/* Grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        />

        <Link href="/" className="group relative flex w-fit items-center gap-2.5 rounded-lg animate-fade-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
            <Icons.Lion className="h-7 w-7" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Lion Shop</span>
        </Link>

        <BrandStage />

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight animate-fade-up xl:text-4xl" style={{ animationDelay: '0.2s' }}>
            Quản lý cửa hàng gọn gàng,{' '}
            <span className="bg-linear-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent bg-gradient-animated">
              mọi lúc mọi nơi.
            </span>
          </h2>
          <ul className="mt-6 space-y-3">
            {highlights.map((text, i) => (
              <li
                key={text}
                className="flex items-start gap-3 text-sm leading-relaxed text-slate-300 animate-fade-left"
                style={{ animationDelay: `${0.5 + i * 0.12}s` }}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Lion Shop · Hàng đẹp · Giá rẻ · Giao nhanh
        </p>
      </aside>

      {/* Form column */}
      <main className="relative flex flex-col overflow-hidden px-4 py-6 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl animate-blob dark:bg-emerald-500/10" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl animate-blob dark:bg-teal-500/10" style={{ animationDelay: '5s' }} />
        </div>

        <div className="relative flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Trang chủ
          </Link>
          <ThemeToggleBtn />
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">
            {/* Compact logo on mobile, where the brand panel is hidden */}
            <Link href="/" className="mb-6 flex w-fit items-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-100 to-amber-100 ring-1 ring-emerald-200 animate-float-slow dark:from-emerald-500/20 dark:to-amber-500/10 dark:ring-emerald-500/30">
                <Icons.Lion className="h-7 w-7" />
              </span>
              <span className="font-semibold tracking-tight">Lion Shop</span>
            </Link>

            <div className="rounded-3xl border bg-card/80 p-6 shadow-2xl shadow-emerald-900/5 backdrop-blur-xl sm:p-8 dark:bg-card/60 dark:shadow-black/30">
              <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </div>

              {children}

              <div className="mt-7 border-t pt-5 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
