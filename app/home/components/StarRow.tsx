'use client'

import { Star } from 'lucide-react'

export function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div role="img" className="group/stars flex gap-0.5" aria-label={`${count} sao`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-200 group-hover/stars:scale-125"
          style={{ transitionDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  )
}
