'use client'

import Image from 'next/image'
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
    name: initialData?.name ?? '',
    originalPrice: initialData?.originalPrice ?? 0,
    sellingPrice: initialData?.sellingPrice ?? 0,
    stock: initialData?.stock ?? 0,
    image: initialData?.image ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url = initialData ? `/api/products/${initialData._id}` : '/api/products'
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
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-name">Product Name</Label>
        <Input
          id="prod-name"
          required
          placeholder="e.g. Nike Air Max"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-cost">Cost (₫)</Label>
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
          <Label htmlFor="prod-price">Selling Price (₫)</Label>
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

      {/* Stock */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-stock">Stock</Label>
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

      {/* Image */}
      <div className="space-y-1.5">
        <Label>Product Image</Label>

        {initialData?.image &&
          formData.image === initialData.image && (
            <div className="flex items-center gap-3 mb-2">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg border">
                <Image
                  src={formData.image}
                  alt="Current product image"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Current image — upload to replace
              </p>
            </div>
          )}

        <ImageUploadButton
          initialImageUrl={formData.image || undefined}
          onUploadSuccess={(res) =>
            setFormData((p) => ({ ...p, image: res.secure_url }))
          }
          onUploadError={(err) => setError(`Upload error: ${err}`)}
          onReset={() =>
            setFormData((p) => ({ ...p, image: initialData?.image ?? '' }))
          }
        />

        {!formData.image && (
          <p className="text-xs text-muted-foreground">
            No image — you can skip or upload one
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving…' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
