'use client'

import { MessagesSquare } from 'lucide-react'
import { ReviewCarousel } from './ReviewCarousel'
import { SectionHeading } from './Reveal'
import { StarRow } from './StarRow'
import type { Review } from '../const'

interface ReviewSectionProps {
  reviews: Review[]
  reviewsRef: React.RefObject<HTMLElement | null>
}

export function ReviewSection({ reviews, reviewsRef }: ReviewSectionProps) {
  return (
    <section ref={reviewsRef} id="reviews" className="relative z-10 mx-auto max-w-6xl scroll-mt-20 px-6 pb-28 lg:px-12">
      <SectionHeading
        eyebrow="Reviews"
        title="Khách hàng nói gì?"
        icon={MessagesSquare}
        description="Hơn 500 đánh giá 5 sao từ khách hàng thân thiết"
      />

      {/* Overall rating */}
      <div className="-mt-4 mb-12 flex justify-center">
        <div className="inline-flex items-center gap-4 rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white px-6 py-3 shadow-sm transition-transform duration-300 hover:scale-105 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-slate-900">
          <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">4.9</span>
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
