'use client'

import { useRef } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function formatDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function DateInput({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  className,
  disabled,
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    if (disabled) return
    try { inputRef.current?.showPicker() } catch { inputRef.current?.focus() }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
      onClick={open}
      className={cn(
        'relative flex items-center gap-1.5 h-9 min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm cursor-pointer select-none transition-colors',
        'hover:border-ring/60 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40',
        'focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/40',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      <span className={cn(
        'flex-1 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis',
        !value && 'text-muted-foreground/60',
      )}>
        {value ? formatDisplay(value) : placeholder}
      </span>

      {value && !disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange('') }}
          className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Xóa ngày"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Native date picker — invisible but fully interactive */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
