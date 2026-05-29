'use client'

import { useState } from 'react'
import { MapPin, Phone, User } from 'lucide-react'
import { Customer } from '@/lib/types'
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

interface CustomerEditModalProps {
  customer: Customer | null
  onClose: () => void
  onSaved: (updated: Customer) => void
}

function EditForm({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer
  onClose: () => void
  onSaved: (updated: Customer) => void
}) {
  const [form, setForm] = useState({
    name:    customer.name,
    phone:   customer.phone,
    address: customer.address ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${customer._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại')
      onSaved(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="c-name"><User className="w-3.5 h-3.5" /> Họ và tên</Label>
        <Input
          id="c-name"
          required
          placeholder="Họ và tên"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-phone"><Phone className="w-3.5 h-3.5" /> Số điện thoại</Label>
        <Input
          id="c-phone"
          type="tel"
          required
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-address"><MapPin className="w-3.5 h-3.5" /> Địa chỉ</Label>
        <Textarea
          id="c-address"
          placeholder="Địa chỉ (tùy chọn)"
          value={form.address}
          rows={2}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
        />
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </form>
  )
}

export default function CustomerEditModal({ customer, onClose, onSaved }: CustomerEditModalProps) {
  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
        </DialogHeader>
        {customer && (
          <EditForm key={customer._id} customer={customer} onClose={onClose} onSaved={onSaved} />
        )}
      </DialogContent>
    </Dialog>
  )
}
