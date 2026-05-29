'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value: string          // YYYY-MM-DD or ''
  onChange: (val: string) => void
  className?: string
  disabled?: boolean
}

function toParts(iso: string): { d: string; m: string; y: string } {
  if (!iso) return { d: '', m: '', y: '' }
  const [y, m, d] = iso.split('-')
  return { d: d ?? '', m: m ?? '', y: y ?? '' }
}

function toISO(d: string, m: string, y: string): string {
  if (!d || !m || !y || y.length < 4) return ''
  const dd = d.padStart(2, '0')
  const mm = m.padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export function DateInput({ value, onChange, className, disabled }: DateInputProps) {
  const init         = toParts(value)
  const [d, setD]   = useState(init.d)
  const [m, setM]   = useState(init.m)
  const [y, setY]   = useState(init.y)
  const mRef        = useRef<HTMLInputElement>(null)
  const yRef        = useRef<HTMLInputElement>(null)

  // Sync outward when value is cleared externally
  useEffect(() => {
    if (!value) { setD(''); setM(''); setY('') }
  }, [value])

  const emit = (nd: string, nm: string, ny: string) => {
    const iso = toISO(nd, nm, ny)
    onChange(iso)
  }

  const handleDay = (raw: string) => {
    const val = raw.replace(/\D/g, '').slice(0, 2)
    setD(val)
    emit(val, m, y)
    if (val.length === 2) mRef.current?.focus()
  }

  const handleMonth = (raw: string) => {
    const val = raw.replace(/\D/g, '').slice(0, 2)
    setM(val)
    emit(d, val, y)
    if (val.length === 2) yRef.current?.focus()
  }

  const handleYear = (raw: string) => {
    const val = raw.replace(/\D/g, '').slice(0, 4)
    setY(val)
    emit(d, m, val)
  }

  const base = 'w-full bg-transparent outline-none tabular-nums text-center'

  return (
    <div className={cn(
      'flex items-center h-8 gap-0.5 rounded-lg border border-input bg-transparent px-2 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
      disabled && 'opacity-50 pointer-events-none',
      className,
    )}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="ngày"
        value={d}
        onChange={(e) => handleDay(e.target.value)}
        disabled={disabled}
        className={cn(base, 'w-8 placeholder:text-muted-foreground/60')}
      />
      <span className="text-muted-foreground select-none">/</span>
      <input
        ref={mRef}
        type="text"
        inputMode="numeric"
        placeholder="th"
        value={m}
        onChange={(e) => handleMonth(e.target.value)}
        disabled={disabled}
        className={cn(base, 'w-6 placeholder:text-muted-foreground/60')}
      />
      <span className="text-muted-foreground select-none">/</span>
      <input
        ref={yRef}
        type="text"
        inputMode="numeric"
        placeholder="năm"
        value={y}
        onChange={(e) => handleYear(e.target.value)}
        disabled={disabled}
        className={cn(base, 'w-11 placeholder:text-muted-foreground/60')}
      />
    </div>
  )
}
