'use client'

import { useState } from 'react'
import { Product } from '@/lib/types'
import ImageUploadButton from './ImageUploadButton'
import VndInput from './VndInput'
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
    brand:         initialData?.brand         ?? '',
    type:          initialData?.type          ?? '',
    originalPrice: initialData?.originalPrice ?? 0,
    sellingPrice:  initialData?.sellingPrice  ?? 0,
    stockHN:       initialData?.stockHN       ?? 0,
    stockQB:       initialData?.stockQB       ?? 0,
    stockSG:       initialData?.stockSG       ?? 0,
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

      {/* Nhãn hàng & Loại sản phẩm */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-brand">Nhãn hàng</Label>
          <Input
            id="prod-brand"
            required
            placeholder="VD: L'Oréal"
            value={formData.brand}
            onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-type">Loại sản phẩm</Label>
          <Input
            id="prod-type"
            required
            placeholder="VD: Mỹ phẩm, Nước hoa"
            value={formData.type}
            onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
          />
        </div>
      </div>

      {/* Giá */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-cost">Giá vốn (₫)</Label>
          <VndInput
            id="prod-cost"
            required
            value={formData.originalPrice}
            onChange={(v) => setFormData((p) => ({ ...p, originalPrice: v }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-price">Giá bán (₫)</Label>
          <VndInput
            id="prod-price"
            required
            value={formData.sellingPrice}
            onChange={(v) => setFormData((p) => ({ ...p, sellingPrice: v }))}
          />
        </div>
      </div>

      {/* Tồn kho theo kho */}
      <div className="space-y-1.5">
        <Label>Tồn kho theo kho</Label>
        <div className="grid grid-cols-3 gap-3">
          {([['stockHN', 'Hà Nội'], ['stockQB', 'Quảng Bình'], ['stockSG', 'Sài Gòn']] as const).map(([field, label]) => (
            <div key={field} className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Input
                type="number"
                required
                min="0"
                value={formData[field]}
                onChange={(e) => setFormData((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
              />
            </div>
          ))}
        </div>
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
