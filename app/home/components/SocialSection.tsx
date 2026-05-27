'use client'

import { ExternalLink } from 'lucide-react'

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
    <section ref={contactRef} id="contact" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">Follow us</p>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl text-slate-900 dark:text-white">Theo dõi Shop ở đâu 📲</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Follow để cập nhật hàng mới và ưu đãi hot mỗi ngày!</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p, i) => (
          <div
            key={p.id}
            className={`animate-fade-up group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Platform badge */}
            <div className={`mb-5 inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs font-bold shadow-sm dark:bg-white dark:text-slate-900`}>
              {p.icon} {p.name}
            </div>

            {/* Phone mockup */}
            <div className="relative mb-5">
              <div className="relative h-[192px] w-[108px] rounded-[22px] bg-slate-800 border-[3px] border-slate-700 shadow-2xl overflow-hidden">
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
              <div className={`pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-slate-300 dark:bg-slate-700 opacity-30 blur-xl`} />
            </div>

            {/* Info */}
            <p className="font-bold text-sm text-center text-slate-900 dark:text-white">{p.handle}</p>
            <p className="mt-0.5 mb-5 text-xs text-slate-600 dark:text-slate-400 text-center">{p.stat}</p>

            {/* CTA */}
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 hover:scale-105 transition-all duration-200 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100`}
            >
              {p.cta} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
