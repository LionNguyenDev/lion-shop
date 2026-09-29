import type { Metadata } from 'next'
import { Fira_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'
import { AdminBanner } from '@/components/AdminBanner'

// Fira Sans ships a Vietnamese subset; Fira Code (the paired heading font) does not,
// so JetBrains Mono covers numbers and code instead.
const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets:  ['latin', 'latin-ext', 'vietnamese'],
  weight:   ['300', '400', '500', '600', '700'],
  display:  'swap',
})
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets:  ['latin', 'latin-ext', 'vietnamese'],
  display:  'swap',
})

export const metadata: Metadata = {
  title: 'Lion Shop',          // ← đổi tên hiển thị trên tab ở đây
  description: 'Lion Shop — Thiên đường mua sắm dễ thương',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <AdminBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
