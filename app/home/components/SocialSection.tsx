'use client'

import { ExternalLink, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './Reveal'

interface Platform {
  id: string
  name: string
  icon: React.ReactNode
  handle: string
  stat: string
  gradient: string
  glow: string
  href: string
  cta: string
  screen: string
}

interface SocialSectionProps {
  platforms: Platform[]
  contactRef: React.RefObject<HTMLElement | null>
}

function PhoneScreenContent({ type }: { type: string }) {
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

export function SocialSection({ platforms, contactRef }: SocialSectionProps) {
  return (
    <section ref={contactRef} id="contact" className="relative z-10 mx-auto max-w-6xl scroll-mt-20 px-6 pb-28 lg:px-12">
      <SectionHeading
        eyebrow="Follow us"
        title="Theo dõi Shop ở đâu"
        icon={Smartphone}
        description="Follow để cập nhật hàng mới và ưu đãi hot mỗi ngày!"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p) => (
          <div
            key={p.id}
            className={cn(
              'group relative flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/60',
              'group-data-[visible=false]/reveal:translate-y-8 group-data-[visible=false]/reveal:opacity-0',
              p.glow,
            )}
          >
            {/* Brand wash that fills in on hover */}
            <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br opacity-10 transition-all duration-500 group-hover:h-full group-hover:opacity-[0.07]', p.gradient)} />

            {/* Platform badge */}
            <div className={cn('relative mb-5 inline-flex items-center gap-1.5 rounded-full bg-linear-to-r px-3 py-1.5 text-xs font-bold text-white shadow-md', p.gradient)}>
              {p.icon} {p.name}
            </div>

            {/* Phone mockup */}
            <div className="relative mb-5 transition-transform duration-500 group-hover:-translate-y-1 group-hover:-rotate-3 group-hover:scale-105">
              <div className="relative h-48 w-27 overflow-hidden rounded-[22px] border-[3px] border-slate-700 bg-slate-800 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-[6px] left-1/2 -translate-x-1/2 z-10 h-[5px] w-[28px] rounded-full bg-slate-700" />
                {/* Screen content */}
                <div className="absolute inset-[3px] top-[13px] bottom-[10px] rounded-[17px] overflow-hidden">
                  <PhoneScreenContent type={p.id} />
                </div>
                {/* Home indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-[26px] rounded-full bg-slate-600" />
              </div>
              {/* Glow */}
              <div className={cn('pointer-events-none absolute -bottom-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-linear-to-r opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60', p.gradient)} />
            </div>

            {/* Info */}
            <p className="relative text-center text-sm font-bold text-slate-900 dark:text-white">{p.handle}</p>
            <p className="relative mb-5 mt-0.5 text-center text-xs text-slate-600 dark:text-slate-400">{p.stat}</p>

            {/* CTA */}
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('btn-shimmer relative mt-auto inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg', p.gradient)}
            >
              {p.cta} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
