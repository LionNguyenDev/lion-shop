'use client'

import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import ProductForm from '@/components/ProductForm'
import ProductList from '@/components/ProductList'
import { Product } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!cancelled) setProducts(data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Product Inventory
            </h1>
            <p className="text-slate-500">
              Manage your Lion shop stock and prices
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setIsFormOpen(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductList
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            {isFormOpen && (
              <ProductForm
                key={editingProduct?._id || 'new'}
                initialData={editingProduct}
                onSuccess={() => {
                  setIsFormOpen(false)
                  fetchProducts()
                }}
                onCancel={() => setIsFormOpen(false)}
              />
            )}
            {!isFormOpen && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <p className="text-blue-800 text-sm mb-2">
                  Need to add or update stock?
                </p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="text-blue-600 font-semibold hover:underline text-sm"
                >
                  Click here to open the form
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
