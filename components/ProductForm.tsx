'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Product } from '@/lib/types'
import ImageUploadButton from './ImageUploadButton'

interface ProductFormProps {
  initialData?: Product | null
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProductForm({
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    originalPrice: initialData?.originalPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    stock: initialData?.stock || 0,
    image: initialData?.image || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = initialData
      ? `/api/products/${initialData._id}`
      : '/api/products'
    const method = initialData ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      onSuccess?.()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-slate-200"
    >
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Product' : 'Add New Product'}
      </h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Product Name
        </label>
        <input
          type="text"
          required
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Original Price ($)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.originalPrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                originalPrice: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Selling Price ($)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.sellingPrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sellingPrice: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Initial Stock
        </label>
        <input
          type="number"
          required
          min="0"
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.stock}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              stock: parseInt(e.target.value) || 0,
            }))
          }
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Product Image
        </label>

        {/* Hiển thị ảnh cũ khi edit và chưa upload ảnh mới */}
        {initialData?.image &&
          !formData.image.startsWith('blob:') &&
          formData.image === initialData.image && (
            <div className="mb-2 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                <Image
                  src={formData.image}
                  alt="Current product image"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-slate-500">
                Ảnh hiện tại — upload mới để thay thế
              </p>
            </div>
          )}

        <ImageUploadButton
          // Truyền initialImage để component biết đang ở chế độ edit
          initialImageUrl={
            formData.image && formData.image !== '' ? formData.image : undefined
          }
          onUploadSuccess={(res) => {
            // Lưu secure_url vào formData để gửi lên server
            setFormData((prev) => ({ ...prev, image: res.secure_url }))
          }}
          onUploadError={(err) => setError(`Lỗi upload ảnh: ${err}`)}
          onReset={() => {
            // Khi user bấm "Đổi ảnh", reset về ảnh cũ (nếu edit) hoặc xoá
            setFormData((prev) => ({
              ...prev,
              image: initialData?.image || '',
            }))
          }}
        />

        {/* Validation: báo nếu chưa có ảnh */}
        {!formData.image && (
          <p className="mt-1 text-xs text-slate-400">
            Chưa có ảnh — có thể bỏ qua hoặc upload ảnh sản phẩm
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? 'Saving...'
            : initialData
              ? 'Update Product'
              : 'Create Product'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
