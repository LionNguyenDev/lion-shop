'use client'

import { AlertTriangle, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Order, Product } from '@/lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders'),
        ])
        const products = await prodRes.json()
        const orders = await orderRes.json()

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          lowStock: products.filter((p: Product) => p.stock <= 5).length,
          totalRevenue: orders.reduce(
            (acc: number, o: Order) => acc + o.totalAmount,
            0,
          ),
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Tổng số sản phẩm',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue',
      link: '/products',
    },
    {
      title: 'Tổng số đơn hàng',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'green',
      link: '/orders',
    },
    {
      title: 'Tổng doanh thu',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'indigo',
      link: '/orders',
    },
    {
      title: 'Sản phẩm sắp hết hàng',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'red',
      link: '/products',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Tổng Quan Shop Lion
          </h1>
          <p className="text-slate-500">
            Chúc chủ shop Thuỳ Linh mua may bắn đắt
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">
            Loading dashboard data...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <Link
                key={idx}
                href={stat.link}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900">
                      {stat.value}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="flex-1 bg-slate-900 text-white p-4 rounded-lg text-center hover:bg-slate-800 transition-colors"
              >
                Manage Inventory
              </Link>
              <Link
                href="/orders"
                className="flex-1 border border-slate-200 p-4 rounded-lg text-center hover:bg-slate-50 transition-colors"
              >
                Process Orders
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2">System Status</h2>
              <p className="text-blue-100 text-sm">
                Database connection is active and stable.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-medium uppercase tracking-wider">
                Live Monitoring Active
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
