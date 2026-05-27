'use client'

interface AboutSectionProps {
  aboutRef: React.RefObject<HTMLElement | null>
}

export function AboutSection({ aboutRef }: AboutSectionProps) {
  return (
    <>
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slideInFromLeft 0.8s ease-out forwards;
        }
        .animate-slide-right {
          animation: slideInFromRight 0.8s ease-out forwards;
          animation-delay: 0.15s;
        }
      `}</style>
      <section ref={aboutRef} id="about" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20 mt-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">About us</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl text-slate-900 dark:text-white">Về Lion Shop 🦁</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* About the shop */}
          <div className="animate-slide-left rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm text-2xl">
            🏪
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Câu chuyện của chúng mình</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Lion Shop ra đời từ niềm đam mê với mỹ phẩm, thời trang và phụ kiện dễ thương. Chúng mình tin rằng ai cũng xứng đáng được mặc đẹp mà không cần chi quá nhiều tiền 💜
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Với hơn <strong className="text-slate-900 dark:text-white">1.000 sản phẩm</strong> trải dài từ mỹ phẩm, thời trang, phụ kiện đến đồ gia dụng cute, Lion Shop luôn cập nhật xu hướng mới nhất để bạn luôn trendy với mức giá siêu hạt dẻ — bắt đầu chỉ từ <strong className="text-slate-900 dark:text-white">29.000₫</strong>.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Mỗi đơn hàng đều được đóng gói cẩn thận, giao nhanh toàn quốc trong 1–3 ngày. Chúng mình luôn sẵn sàng hỗ trợ bạn 24/7 qua các kênh mạng xã hội 🚀
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { value: '1K+', label: 'Sản phẩm', icon: '📦' },
              { value: '500+', label: 'Khách hàng', icon: '🥰' },
              { value: '4.9★', label: 'Đánh giá', icon: '⭐' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 p-3 text-center">
                <p className="text-lg">{s.icon}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">{s.label}</p>
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
              <p key={f} className="text-sm text-slate-600 dark:text-slate-400">{f}</p>
            ))}
          </div>
        </div>

        {/* About the owner */}
        <div className="animate-slide-right rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm text-2xl">
            👩
          </div>
          <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Chủ Lion Shop</h3>

          {/* Owner card */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl shadow-sm border border-slate-300 dark:border-slate-600">
                🦁
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 shadow-sm" />
            </div>
            <div>
              <p className="font-bold text-base text-slate-900 dark:text-white">Dương Thị Thuỳ Linh</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Owner · 23 tuổi</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">📍 Lệ Thuỷ Quảng Bình</p>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">Fashion lover</span>
                <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">Dreamer ✨</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
            Mình là Linh — một cô gái 22 tuổi yêu thích thời trang và luôn muốn mọi người xung quanh được mặc đẹp với giá cả hợp lý nhất 🌸
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
            Lion Shop được mình bắt đầu từ một góc nhỏ trong phòng ngủ, với chiếc điện thoại và niềm đam mê cháy bỏng. Giờ đây shop đã phục vụ hơn 500 khách hàng thân thiết trên khắp Việt Nam 🇻🇳
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Mình luôn chọn lọc kỹ càng từng sản phẩm để đảm bảo bạn nhận được điều tốt nhất. Mỗi đơn hàng không chỉ là một giao dịch — đó là một nụ cười mình muốn gửi đến bạn 💕
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs italic text-slate-600 dark:text-slate-400">
              &ldquo;Mình muốn Lion Shop là nơi bất kỳ ai cũng tìm được thứ mình thích, với mức giá mà ai cũng có thể vui vẻ mua 🎀&rdquo;
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">— Dương Thị Thuỳ Linh</p>
          </div>

          <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-600 italic">
            * Hình ảnh chủ shop sẽ được cập nhật sớm 📷
          </p>
        </div>
      </div>
      </section>
    </>
  )
}
