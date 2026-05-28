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

function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN')
}

export default function VndInput({ value, onChange, className, ...props }: VndInputProps) {
  const [display, setDisplay] = useState(() => (value === 0 ? '' : formatVnd(value)))

  useEffect(() => {
    const current = parseInt(display.replace(/\./g, '') || '0', 10)
    if (current !== value) {
      setDisplay(value === 0 ? '' : formatVnd(value))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^\d]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setDisplay(raw === '' ? '' : formatVnd(num))
    onChange(num)
  }

  const handleBlur = () => {
    setDisplay(value === 0 ? '0' : formatVnd(value))
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
