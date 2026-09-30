'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Icons } from '@/assets/icons'

interface Contact {
  name: string
  iconType: string
  handle: string
  href: string
  color: string
  shadow: string
}

interface FooterProps {
  contacts: Contact[]
  scrollTo: (ref: React.RefObject<HTMLElement | null>) => void
  aboutRef: React.RefObject<HTMLElement | null>
  reviewsRef: React.RefObject<HTMLElement | null>
  contactRef: React.RefObject<HTMLElement | null>
}

export function Footer({ contacts, scrollTo, aboutRef, reviewsRef, contactRef }: FooterProps) {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="group mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-100 to-amber-100 ring-1 ring-emerald-200 transition-transform duration-300 group-hover:-rotate-8 group-hover:scale-110 dark:from-emerald-500/20 dark:to-amber-500/10 dark:ring-emerald-500/30">
                <Icons.Lion className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">Lion Shop</p>
                <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">Cosmetic & Beauty</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Thiên đường mua sắm dễ thương của bạn. Hàng đẹp, giá rẻ, giao nhanh.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4">Khám phá</p>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><button onClick={() => scrollTo(aboutRef)} className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-emerald-700 dark:hover:text-emerald-300">Về chúng mình</button></li>
              <li><button onClick={() => scrollTo(reviewsRef)} className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-emerald-700 dark:hover:text-emerald-300">Đánh giá khách hàng</button></li>
              <li><button onClick={() => scrollTo(contactRef)} className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-emerald-700 dark:hover:text-emerald-300">Theo dõi Shop</button></li>
              <li><Link href="/signin" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-emerald-700 dark:hover:text-emerald-300">Đăng nhập</Link></li>
            </ul>
          </div>

          {/* Social quick */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4">Mạng xã hội</p>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              {contacts.map((c) => {
                const getIcon = () => {
                  switch(c.iconType) {
                    case 'facebook':
                      return <Icons.Facebook className="h-4 w-4" />
                    case 'instagram':
                      return <Icons.Instagram className="h-4 w-4" />
                    case 'zalo':
                      return <Icons.Zalo className="h-4 w-4" />
                    case 'threads':
                      return <Icons.Threads className="h-4 w-4" />
                    default:
                      return null
                  }
                }
                return (
                  <li key={c.name}>
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="group/s inline-flex items-center gap-2 transition-all duration-200 hover:translate-x-1 hover:text-emerald-700 dark:hover:text-emerald-300">
                      <span className="transition-transform duration-200 group-hover/s:scale-125">{getIcon()}</span> {c.name}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-6 text-xs text-slate-600 dark:text-slate-400 sm:flex-row">
          <p>© 2026 Lion Shop <Heart className="inline h-3 w-3 animate-pulse fill-rose-500 text-rose-500" /> Dev: LuuG </p>
          <p className="flex items-center gap-3">
            <span>Chính sách bảo mật</span>
            <span>·</span>
            <span>Điều khoản sử dụng</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300"><Icons.Lion className="h-4 w-4" /> Lion Shop</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
