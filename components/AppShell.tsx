import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

interface AppShellProps {
  children: React.ReactNode
  title: string
  description?: string
  orderBadge?: number
  productBadge?: number
  customerBadge?: number
}

export function AppShell({
  children,
  title,
  description,
  orderBadge,
  productBadge,
  customerBadge,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0">
        <Sidebar orderBadge={orderBadge} productBadge={productBadge} customerBadge={customerBadge} />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={title}
          description={description}
          orderBadge={orderBadge}
          productBadge={productBadge}
          customerBadge={customerBadge}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
