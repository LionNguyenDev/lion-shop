'use client'

import { ReviewCarousel } from './ReviewCarousel'
import { StarRow } from './StarRow'
import type { Review } from '../const'

interface ReviewSectionProps {
  reviews: Review[]
  reviewsRef: React.RefObject<HTMLElement | null>
}

export function ReviewSection({ reviews, reviewsRef }: ReviewSectionProps) {
  return (
    <section ref={reviewsRef} id="reviews" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 scroll-mt-20">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">Reviews</p>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl text-slate-900 dark:text-white">Khách hàng nói gì? 💬</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Hơn 500 đánh giá 5 sao từ khách hàng thân thiết</p>

        {/* Overall rating */}
        <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-3xl font-black text-slate-900 dark:text-white">4.9</span>
          <div>
            <StarRow />
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">dựa trên 500+ đánh giá</p>
          </div>
        </div>
      </div>

      <ReviewCarousel reviews={reviews} />
    </section>
  )
}
