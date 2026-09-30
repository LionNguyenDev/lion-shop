'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AuthFieldProps extends React.ComponentProps<'input'> {
  id: string
  label: string
  icon: React.ElementType
  hint?: React.ReactNode
}

/** Labelled input with a leading icon, used across the sign-in / sign-up forms */
export function AuthField({ id, label, icon: Icon, hint, className, type, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="group space-y-1.5">
      <Label htmlFor={id} className="transition-colors group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-400">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400" />
        <Input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'h-11 bg-background/60 pl-9 transition-all duration-200 hover:border-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 focus-visible:shadow-lg focus-visible:shadow-emerald-500/10 dark:hover:border-slate-500',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
          >
            {visible
              ? <EyeOff key="off" className="h-4 w-4 animate-in zoom-in-50 fade-in" />
              : <Eye key="on" className="h-4 w-4 animate-in zoom-in-50 fade-in" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Re-mount (change `key`) to replay the shake on every failed attempt */
export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-shake"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

interface AuthSubmitProps {
  loading: boolean
  success: boolean
  loadingText: string
  successText: string
  children: React.ReactNode
}

export function AuthSubmit({ loading, success, loadingText, successText, children }: AuthSubmitProps) {
  return (
    <Button
      type="submit"
      disabled={loading || success}
      className={cn(
        'btn-shimmer group/submit h-11 w-full text-sm font-semibold text-white shadow-lg transition-all duration-200 disabled:opacity-100',
        success
          ? 'bg-emerald-600 shadow-emerald-600/30'
          : 'bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-gradient-animated shadow-emerald-700/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/30 active:translate-y-0 active:scale-[0.99]',
      )}
    >
      {success ? (
        <span className="inline-flex items-center gap-2 animate-pop-in">
          <Check className="h-4 w-4" /> {successText}
        </span>
      ) : loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> {loadingText}</>
      ) : (
        <>{children} <ArrowRight className="h-4 w-4 transition-transform group-hover/submit:translate-x-1" /></>
      )}
    </Button>
  )
}
