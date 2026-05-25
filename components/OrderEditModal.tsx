'use client'

import { MapPin, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { formatVND } from '@/lib/format'
import { Order, statusOrders } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderEditModalProps {
  order: Order | null
  onClose: () => void
  onSaved: (updated: Order) => void
}

const ALL_STATUSES = [
  statusOrders.UNPAID,
  statusOrders.PAID,
  statusOrders.PROCESSING,
  statusOrders.PENDING,
  statusOrders.SHIPPED,
  statusOrders.DELIVERED,
  statusOrders.COMPLETED,
  statusOrders.CANCELLED,
  statusOrders.RETURNED,
  statusOrders.FAILED,
] as const

const statusActiveClass: Record<string, string> = {
  [statusOrders.UNPAID]:     'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  [statusOrders.PAID]:       'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  [statusOrders.PROCESSING]: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  [statusOrders.PENDING]:    'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  [statusOrders.SHIPPED]:    'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  [statusOrders.DELIVERED]:  'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  [statusOrders.COMPLETED]:  'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  [statusOrders.CANCELLED]:  'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  [statusOrders.RETURNED]:   'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
  [statusOrders.FAILED]:     'bg-red-500/30 text-red-700 dark:text-red-400 border-red-500/40',
}

export default function OrderEditModal({
  order,
  onClose,
  onSaved,
}: OrderEditModalProps) {
  const [form, setForm] = useState({
    name: order?.name ?? '',
    phone: order?.phone ?? '',
    address: order?.address ?? '',
    status: (order?.status ?? statusOrders.UNPAID) as statusOrders,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!order) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update order')
      onSaved(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          {order && (
            <p className="text-xs font-mono text-muted-foreground">
              #{order._id.slice(-10).toUpperCase()}
            </p>
          )}
        </DialogHeader>

        {order && (
          <form key={order._id} onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Customer info */}
            <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Customer
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="edit-name">
                  <User className="w-3.5 h-3.5" /> Full name
                </Label>
                <Input
                  id="edit-name"
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  required
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-addr">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </Label>
                <Textarea
                  id="edit-addr"
                  required
                  placeholder="Delivery address"
                  value={form.address}
                  rows={2}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                      form.status === s
                        ? statusActiveClass[s]
                        : 'bg-background text-muted-foreground border-border hover:bg-muted',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Items (read-only) */}
            <div className="space-y-2">
              <Label>Items</Label>
              <div className="divide-y rounded-lg border overflow-hidden">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-card text-sm"
                  >
                    <span>
                      <span className="font-semibold">{item.quantity}×</span>{' '}
                      {item.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold px-1">
                <span className="text-muted-foreground">Total</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatVND(order.totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
