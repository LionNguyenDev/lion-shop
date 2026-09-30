'use client'

import { Camera, Check, HeartHandshake, MapPin, Package, Quote, Sparkles, Star, Store, UserRound } from 'lucide-react'
import { Icons } from '@/assets/icons'
import { SectionHeading } from './Reveal'

interface AboutSectionProps {
  aboutRef: React.RefObject<HTMLElement | null>
}

const card =
  'group/card relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-7 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60'

const features = [
  'Hàng ngàn sản phẩm, đa dạng mọi nhu cầu',
  'Giá cả phải chăng — phù hợp mọi túi tiền',
  'Giao hàng nhanh toàn quốc 1–3 ngày',
  'Đổi trả dễ dàng trong 7 ngày',
  'Hỗ trợ khách hàng 24/7',
]

export function AboutSection({ aboutRef }: AboutSectionProps) {
  return (
    <section ref={aboutRef} id="about" className="relative z-10 mx-auto mt-16 max-w-6xl scroll-mt-20 px-6 pb-28 lg:px-12">
      <SectionHeading eyebrow="About us" title="Về Lion Shop" icon={Store} />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* About the shop */}
        <div className={`${card} group-data-[visible=false]/reveal:-translate-x-10 group-data-[visible=false]/reveal:opacity-0`}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl transition-transform duration-700 group-hover/card:scale-125 dark:bg-emerald-500/10" />

          <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover/card:-rotate-6 group-hover/card:scale-110">
            <Store className="h-6 w-6" />
          </div>
          <h3 className="relative mb-3 text-xl font-bold text-slate-900 dark:text-white">Câu chuyện của chúng mình</h3>
          <div className="relative space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <p>
              Lion Shop ra đời từ niềm đam mê với mỹ phẩm, thời trang và phụ kiện dễ thương. Chúng mình tin rằng ai cũng xứng đáng được mặc đẹp mà không cần chi quá nhiều tiền.
            </p>
            <p>
              Với hơn <strong className="text-emerald-700 dark:text-emerald-300">1.000 sản phẩm</strong> trải dài từ mỹ phẩm, thời trang, phụ kiện đến đồ gia dụng cute, Lion Shop luôn cập nhật xu hướng mới nhất để bạn luôn trendy với mức giá siêu hạt dẻ — bắt đầu chỉ từ <strong className="text-emerald-700 dark:text-emerald-300">29.000₫</strong>.
            </p>
            <p>
              Mỗi đơn hàng đều được đóng gói cẩn thận, giao nhanh toàn quốc trong 1–3 ngày. Chúng mình luôn sẵn sàng hỗ trợ bạn 24/7 qua các kênh mạng xã hội.
            </p>
          </div>

          {/* Stats */}
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            {[
              { value: '1K+',  label: 'Sản phẩm',   icon: Package,        tint: 'text-emerald-600 dark:text-emerald-400' },
              { value: '500+', label: 'Khách hàng', icon: HeartHandshake, tint: 'text-rose-500 dark:text-rose-400' },
              { value: '4.9',  label: 'Đánh giá',   icon: Star,           tint: 'fill-amber-400 text-amber-400' },
            ].map((s) => (
              <div
                key={s.label}
                className="group/stat rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
              >
                <s.icon className={`mx-auto mb-1 h-5 w-5 transition-transform duration-300 group-hover/stat:scale-125 ${s.tint}`} />
                <p className="text-base font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <ul className="relative mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* About the owner */}
        <div className={`${card} group-data-[visible=false]/reveal:translate-x-10 group-data-[visible=false]/reveal:opacity-0`}>
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl transition-transform duration-700 group-hover/card:scale-125 dark:bg-amber-500/10" />

          <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-rose-400 text-white shadow-lg shadow-amber-500/30 transition-transform duration-300 group-hover/card:rotate-6 group-hover/card:scale-110">
            <UserRound className="h-6 w-6" />
          </div>
          <h3 className="relative mb-5 text-xl font-bold text-slate-900 dark:text-white">Chủ Lion Shop</h3>

          {/* Owner card */}
          <div className="relative mb-6 flex items-start gap-4">
            <div className="relative shrink-0">
              {/* Rotating gradient ring */}
              <div className="absolute -inset-1 rounded-2xl bg-conic from-emerald-400 via-amber-300 to-emerald-400 animate-spin-slow opacity-80" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
                <Icons.Lion className="h-16 w-16 animate-float-tilt" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Dương Thị Thuỳ Linh</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Owner · 23 tuổi</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="h-3 w-3 text-rose-500" /> Lệ Thuỷ Quảng Bình
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Fashion lover</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"><Sparkles className="mr-1 inline h-3 w-3 -mt-0.5" />Dreamer</span>
              </div>
            </div>
          </div>

          <div className="relative space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <p>
              Mình là Linh — một cô gái 22 tuổi yêu thích thời trang và luôn muốn mọi người xung quanh được mặc đẹp với giá cả hợp lý nhất.
            </p>
            <p>
              Lion Shop được mình bắt đầu từ một góc nhỏ trong phòng ngủ, với chiếc điện thoại và niềm đam mê cháy bỏng. Giờ đây shop đã phục vụ hơn 500 khách hàng thân thiết trên khắp Việt Nam.
            </p>
            <p>
              Mình luôn chọn lọc kỹ càng từng sản phẩm để đảm bảo bạn nhận được điều tốt nhất. Mỗi đơn hàng không chỉ là một giao dịch — đó là một nụ cười mình muốn gửi đến bạn.
            </p>
          </div>

          <figure className="relative mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-amber-50 p-5 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-amber-500/5">
            <Quote className="absolute -right-2 -top-2 h-16 w-16 rotate-12 text-emerald-200 dark:text-emerald-500/20" />
            <blockquote className="relative text-sm italic text-slate-700 dark:text-slate-300">
              &ldquo;Mình muốn Lion Shop là nơi bất kỳ ai cũng tìm được thứ mình thích, với mức giá mà ai cũng có thể vui vẻ mua.&rdquo;
            </blockquote>
            <figcaption className="relative mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">— Dương Thị Thuỳ Linh</figcaption>
          </figure>

          <p className="relative mt-4 text-[11px] italic text-slate-500 dark:text-slate-500">
            <Camera className="mr-1 inline h-3 w-3 -mt-0.5" />Hình ảnh chủ shop sẽ được cập nhật sớm
          </p>
        </div>
      </div>
    </section>
  )
}
