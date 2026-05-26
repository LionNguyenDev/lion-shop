'use client'

import { useState } from 'react'
import { Product } from '@/lib/types'
import ImageUploadButton from './ImageUploadButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    name:          initialData?.name          ?? '',
    originalPrice: initialData?.originalPrice ?? 0,
    sellingPrice:  initialData?.sellingPrice  ?? 0,
    stock:         initialData?.stock         ?? 0,
    image:         initialData?.image         ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url    = initialData ? `/api/products/${initialData._id}` : '/api/products'
    const method = initialData ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Tên sản phẩm */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-name">Tên sản phẩm</Label>
        <Input
          id="prod-name"
          required
          placeholder="VD: Áo thun trắng"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        />
      </div>

      {/* Giá */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-cost">Giá vốn (₫)</Label>
          <Input
            id="prod-cost"
            type="number"
            required
            min="0"
            value={formData.originalPrice}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                originalPrice: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-price">Giá bán (₫)</Label>
          <Input
            id="prod-price"
            type="number"
            required
            min="0"
            value={formData.sellingPrice}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                sellingPrice: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      {/* Tồn kho */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-stock">Tồn kho</Label>
        <Input
          id="prod-stock"
          type="number"
          required
          min="0"
          value={formData.stock}
          onChange={(e) =>
            setFormData((p) => ({ ...p, stock: parseInt(e.target.value) || 0 }))
          }
        />
      </div>

      {/* Hình ảnh */}
      <div className="space-y-1.5">
        <Label>Hình ảnh sản phẩm</Label>

        <ImageUploadButton
          initialImageUrl={formData.image || undefined}
          onUploadSuccess={(res) =>
            setFormData((p) => ({ ...p, image: res.secure_url }))
          }
          onUploadError={(err) => setError(`Lỗi tải lên: ${err}`)}
          onReset={() => setFormData((p) => ({ ...p, image: '' }))}
        />

        {!formData.image && (
          <p className="text-xs text-muted-foreground">
            Chưa có hình — có thể bỏ qua hoặc tải lên
          </p>
        )}
      </div>

      {/* Hành động */}
      <div className="flex gap-3 pt-2 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Đang lưu…' : initialData ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  )
}
