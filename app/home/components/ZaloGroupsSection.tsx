'use client'

import { ZaloGroupsCarousel } from './ZaloGroupsCarousel'

interface ZaloGroup {
  id: number
  name: string
  description: string
  members: string
  info: string
  screenshotBg: string
  link: string
}

interface ZaloGroupsSectionProps {
  groups: ZaloGroup[]
}

export function ZaloGroupsSection({ groups }: ZaloGroupsSectionProps) {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28 mt-16">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">Cộng đồng</p>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl text-slate-900 dark:text-white">Các Nhóm Zalo Lion Shop 💙</h2>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Hơn 1000+ thành viên tham gia cộng đồng Lion Shop trên Zalo. Tham gia nhóm để nhận thông tin sản phẩm mới, ưu đãi độc quyền, và được hỗ trợ trực tiếp từ shop.
        </p>
      </div>

      <ZaloGroupsCarousel groups={groups} />
    </section>
  )
}
