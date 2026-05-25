'use client'

import { MapPin, Phone, Plus, ShoppingCart, Trash2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatVND } from '@/lib/format'
import { Order, Product, statusOrders } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrderFormProps {
  onSuccess?: (order: Order) => void
  onCancel?: () => void
}

const STATUS_OPTIONS = [
  statusOrders.UNPAID,
  statusOrders.PAID,
  statusOrders.PROCESSING,
] as const

const statusActiveClass: Record<string, string> = {
  [statusOrders.UNPAID]:     'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  [statusOrders.PAID]:       'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  [statusOrders.PROCESSING]: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
}

export default function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<
    { product: string; quantity: number; sellingPrice: number }[]
  >([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
  })
  const [status, setStatus] = useState<statusOrders>(statusOrders.UNPAID)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (!ignore) setProducts(data)
      } catch {
        if (!ignore) setError('Failed to load products')
      }
    }
    fetchProducts()
    return () => { ignore = true }
  }, [])

  const addItem = () =>
    setSelectedItems((prev) => [
      ...prev,
      { product: '', quantity: 1, sellingPrice: 0 },
    ])

  const removeItem = (index: number) =>
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))

  const updateItem = (
    index: number,
    field: 'quantity' | 'sellingPrice',
    value: number,
  ) => {
    setSelectedItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId)
    setSelectedItems((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        product: productId,
        sellingPrice: product ? product.sellingPrice : 0,
      }
      return next
    })
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      setError('Add at least one item')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(({ product, quantity, sellingPrice }) => ({
            product,
            quantity,
            price: sellingPrice,
          })),
          ...customerInfo,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')
      onSuccess?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Create New Order
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus /> Add Item
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Order Status */}
      <div className="space-y-1.5">
        <Label>Order Status</Label>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                status === s
                  ? statusActiveClass[s]
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Customer
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="cust-name">
            <User className="w-3.5 h-3.5" /> Full name
          </Label>
          <Input
            id="cust-name"
            required
            placeholder="Full name"
            value={customerInfo.name}
            onChange={(e) =>
              setCustomerInfo((p) => ({ ...p, name: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-phone">
            <Phone className="w-3.5 h-3.5" /> Phone
          </Label>
          <Input
            id="cust-phone"
            type="tel"
            required
            placeholder="Phone number"
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo((p) => ({ ...p, phone: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-addr">
            <MapPin className="w-3.5 h-3.5" /> Address
          </Label>
          <Textarea
            id="cust-addr"
            required
            placeholder="Delivery address"
            value={customerInfo.address}
            rows={2}
            onChange={(e) =>
              setCustomerInfo((p) => ({ ...p, address: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2">
        {selectedItems.map((item, index) => {
          const prod = products.find((p) => p._id === item.product)
          return (
            <div
              key={index}
              className="flex gap-2 items-end p-3 bg-muted/30 rounded-lg border"
            >
              {/* Product select */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Product</Label>
                <Select
                  value={item.product}
                  onValueChange={(val) => val && handleProductChange(index, val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem
                        key={p._id}
                        value={p._id}
                        disabled={p.stock <= 0}
                      >
                        {p.name} — {p.stock} in stock
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Original price (read-only) */}
              {prod && (
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Original</Label>
                  <div className="h-8 px-2.5 flex items-center rounded-lg border bg-muted text-sm text-muted-foreground line-through">
                    {formatVND(prod.originalPrice)}
                  </div>
                </div>
              )}

              {/* Selling price (editable) */}
              <div className="w-28 space-y-1">
                <Label className="text-xs">Price (₫)</Label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={item.sellingPrice}
                  onChange={(e) =>
                    updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              {/* Qty */}
              <div className="w-16 space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                  }
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 />
              </Button>
            </div>
          )
        })}

        {selectedItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg text-sm">
            No items added yet.{' '}
            <button
              type="button"
              onClick={addItem}
              className="font-semibold underline underline-offset-2"
            >
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-2 border-t">
        <Button
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-semibold"
        >
          {loading ? 'Processing…' : 'Place Order'}
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
