'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface VndInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  required?: boolean
  className?: string
  placeholder?: string
}

function formatNum(n: number): string {
  return n.toLocaleString('vi-VN')
}

export default function VndInput({ value, onChange, className, ...props }: VndInputProps) {
  const shortValue = value / 1000
  const [display, setDisplay] = useState(() => (value === 0 ? '' : formatNum(shortValue)))

  useEffect(() => {
    const current = parseInt(display.replace(/\./g, '') || '0', 10)
    if (current !== shortValue) {
      setDisplay(value === 0 ? '' : formatNum(shortValue))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setDisplay(raw === '' ? '' : formatNum(num))
    onChange(num * 1000)
  }

  const handleBlur = () => {
    setDisplay(value === 0 ? '0' : formatNum(shortValue))
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(className)}
    />
  )
}
