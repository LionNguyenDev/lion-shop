'use client'

import { AlertCircle, Edit, Package, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Product } from '@/lib/types'

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  loading: boolean
}

export default function ProductList({
  products,
  onEdit,
  onDelete,
  loading,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-slate-100 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">No products yet</p>
          <p className="text-xs mt-0.5">
            Add your first product to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_repeat(3,9rem)_7rem] items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <div />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Product
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">
          Cost
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">
          Price
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">
          Stock
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">
          Actions
        </span>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-slate-100">
        {products.map((product, idx) => {
          const margin =
            product.originalPrice > 0
              ? (
                  ((product.sellingPrice - product.originalPrice) /
                    product.originalPrice) *
                  100
                ).toFixed(0)
              : null
          const isLowStock = product.stock <= 5

          return (
            <li
              key={product._id}
              className="group grid grid-cols-[2.5rem_1fr_repeat(3,9rem)_7rem] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/60"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="40px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Name + ID */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {product.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  #{product._id.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Original Price */}
              <div className="text-right">
                <p className="text-sm text-slate-500">
                  ${product.originalPrice.toFixed(2)}
                </p>
              </div>

              {/* Selling Price + Margin */}
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  ${product.sellingPrice.toFixed(2)}
                </p>
                {margin !== null && (
                  <span
                    className={`text-[11px] font-medium ${Number(margin) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}
                  >
                    {Number(margin) >= 0 ? '+' : ''}
                    {margin}%
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center justify-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isLowStock
                      ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {isLowStock && <AlertCircle className="h-3 w-3" />}
                  {product.stock}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(product)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                  title="Edit product"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(product._id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                  title="Delete product"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Footer count */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5">
        <p className="text-xs text-slate-400">
          {products.length} {products.length === 1 ? 'product' : 'products'}
          {products.filter((p) => p.stock <= 5).length > 0 && (
            <span className="ml-2 text-red-400">
              · {products.filter((p) => p.stock <= 5).length} low stock
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
