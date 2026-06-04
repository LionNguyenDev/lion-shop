'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, AtSign, Lock, Sparkles, User } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
      toast.success(`Chào mừng bạn đến, ${data.user.name}! 🎉`)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-pink-50 to-violet-50 dark:from-slate-950 dark:via-pink-950 dark:to-slate-900 p-4">

      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-300/40 dark:bg-amber-500/20 blur-3xl animate-blob" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-300/40 dark:bg-violet-500/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <Link href="/" className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-blue-500 to-85% text-white shadow-xl shadow-pink-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">Lion Shop</p>
        </Link>

        <div className="rounded-3xl border bg-white/80 p-7 shadow-2xl shadow-pink-500/10 backdrop-blur-xl dark:bg-white/5">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Tạo tài khoản mới 🎉</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Đăng ký nhanh chóng
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name"><User className="h-3.5 w-3.5" /> Họ và tên</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                placeholder="Nguyễn Danh Lưu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username"><AtSign className="h-3.5 w-3.5" /> Tên đăng nhập</Label>
              <Input
                id="username"
                autoComplete="username"
                required
                minLength={3}
                placeholder="danhluu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password"><Lock className="h-3.5 w-3.5" /> Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-gradient-to-r from-amber-500 via-pink-500 to-violet-500 hover:opacity-90 text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02]"
            >
              {loading ? 'Đang tạo tài khoản…' : <>Tạo tài khoản <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/signin" className="font-semibold text-pink-600 hover:underline dark:text-pink-400">
              Đăng nhập
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' text-xs'}>
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  )
}
