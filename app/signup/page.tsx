'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { AtSign, Lock, PartyPopper, User } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthError, AuthField, AuthSubmit } from '@/components/auth/AuthFields'
import { cn } from '@/lib/utils'

const MIN_PASSWORD = 6

/** 0–4 score from length and character variety */
function passwordScore(pw: string) {
  if (pw.length < MIN_PASSWORD) return pw ? 1 : 0
  let score = 1
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthLabels = ['', 'Yếu', 'Tạm được', 'Khá mạnh', 'Rất mạnh']
const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500']

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [errorKey, setErrorKey] = useState(0)

  const score = passwordScore(password)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại')
      setSuccess(true)
      toast.success(`Chào mừng bạn đến, ${data.user.name}!`)
      // Let the success state show briefly before navigating away
      await new Promise((r) => setTimeout(r, 500))
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={<><span className="inline-flex items-center gap-2">Tạo tài khoản mới <PartyPopper className="h-6 w-6 text-amber-500 animate-float-tilt" /></span></>}
      description="Chỉ mất chưa đến một phút để bắt đầu."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/signin" className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
            Đăng nhập
          </Link>
        </>
      }
    >
      <AuthError key={errorKey} message={error} />

      <form onSubmit={handleSubmit} className="animate-stagger space-y-5">
        <AuthField
          id="name"
          label="Họ và tên"
          icon={User}
          autoComplete="name"
          autoFocus
          required
          placeholder="Nguyễn Danh Lưu"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <AuthField
          id="username"
          label="Tên đăng nhập"
          icon={AtSign}
          autoComplete="username"
          required
          minLength={3}
          placeholder="danhluu"
          hint="Tối thiểu 3 ký tự, dùng để đăng nhập."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <AuthField
          id="password"
          label="Mật khẩu"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          placeholder="••••••••"
          hint={
            <span className="block space-y-1.5">
              <span className="flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        'block h-full origin-left rounded-full transition-transform duration-300 ease-out',
                        strengthColors[score],
                        i <= score ? 'scale-x-100' : 'scale-x-0',
                      )}
                      style={{ transitionDelay: `${(i - 1) * 60}ms` }}
                    />
                  </span>
                ))}
              </span>
              <span className="flex justify-between">
                <span>Ít nhất {MIN_PASSWORD} ký tự</span>
                {score > 0 && <span key={score} className="font-medium text-foreground animate-in fade-in">{strengthLabels[score]}</span>}
              </span>
            </span>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthSubmit loading={loading} success={success} loadingText="Đang tạo tài khoản…" successText="Tạo thành công!">
          Tạo tài khoản
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
