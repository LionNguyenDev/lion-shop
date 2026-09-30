'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Hand, Lock, User } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthError, AuthField, AuthSubmit } from '@/components/auth/AuthFields'

export default function SignInPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [errorKey, setErrorKey] = useState(0)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại')
      setSuccess(true)
      toast.success(`Chào mừng trở lại, ${data.user.name}!`)
      // Let the success state show briefly before navigating away
      await new Promise((r) => setTimeout(r, 500))
      // Friends only have the TikTok tool; admins are sent on to /admin by the middleware
      router.push(data.user.role === 'friend' ? '/tiktok' : '/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
      setErrorKey((k) => k + 1)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={<><span className="inline-flex items-center gap-2">Chào mừng trở lại <Hand className="h-6 w-6 text-amber-500 animate-wave" /></span></>}
      description="Đăng nhập để tiếp tục vào trang quản trị."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/signup" className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <AuthError key={errorKey} message={error} />

      <form onSubmit={handleSubmit} className="animate-stagger space-y-5">
        <AuthField
          id="username"
          label="Tên đăng nhập"
          icon={User}
          autoComplete="username"
          autoFocus
          required
          placeholder="ten-dang-nhap"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <AuthField
          id="password"
          label="Mật khẩu"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthSubmit loading={loading} success={success} loadingText="Đang đăng nhập…" successText="Thành công!">
          Đăng nhập
        </AuthSubmit>
      </form>
    </AuthLayout>
  )
}
