'use client'

import { Users } from 'lucide-react'
import { ZaloGroupsCarousel } from './ZaloGroupsCarousel'
import { SectionHeading } from './Reveal'

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
    <section className="relative z-10 mx-auto mt-16 max-w-6xl px-6 pb-28 lg:px-12">
      <SectionHeading
        eyebrow="Cộng đồng"
        title="Các Nhóm Zalo Lion Shop"
        icon={Users}
        description="Hơn 1000+ thành viên tham gia cộng đồng Lion Shop trên Zalo. Tham gia nhóm để nhận thông tin sản phẩm mới, ưu đãi độc quyền, và được hỗ trợ trực tiếp từ shop."
      />

      <ZaloGroupsCarousel groups={groups} />
    </section>
  )
}
