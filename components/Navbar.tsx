import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          Lion Shop
        </Link>
        <div className="flex gap-6">
          <Link
            href="/products"
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <Package className="w-5 h-5" />
            Sản Phẩm
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Hoá đơn
          </Link>
        </div>
      </div>
    </nav>
  )
}
