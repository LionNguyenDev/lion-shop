'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { Pencil, Search, XCircle } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Customer } from '@/lib/types'
import CustomerEditModal from '@/components/CustomerEditModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 20

export default function CustomersPage() {
  const [customers, setCustomers]             = useState<Customer[]>([])
  const [total, setTotal]                     = useState(0)
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage]                       = useState(1)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCustomers(data.customers ?? [])
          setTotal(data.total ?? 0)
        }
      })
      .catch(() => { if (!cancelled) toast.error('Không thể tải danh sách khách hàng') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSaved = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
    setEditingCustomer(null)
    toast.success('Đã cập nhật khách hàng')
  }

  return (
    <AppShell
      title="Khách hàng"
      description="Danh sách tất cả khách hàng"
      customerBadge={total || undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Danh sách khách hàng</h2>
          <p className="text-sm text-muted-foreground">
            Tất cả khách hàng, sắp xếp theo số lần mua
          </p>
        </div>
        {!loading && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            {total.toLocaleString('vi-VN')} khách
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc SĐT…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
            <XCircle className="h-4 w-4" /> Xóa
          </Button>
        )}
      </div>

      {!loading && (
        <p className="mb-3 text-xs text-muted-foreground">
          Hiển thị {customers.length} trong {total} khách hàng
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Tên</th>
              <th className="px-4 py-3 text-left font-medium">SĐT</th>
              <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Địa chỉ</th>
              <th className="px-4 py-3 text-right font-medium">Số lần mua</th>
              <th className="px-4 py-3 text-right font-medium hidden md:table-cell">Ngày tạo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : customers.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                      Không tìm thấy khách hàng nào
                    </td>
                  </tr>
                )
              : customers.map((c) => (
                  <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-48 truncate">
                      {c.address || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="tabular-nums font-semibold">
                        {c.orderCount ?? 0}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingCustomer(c)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-4" />

      <CustomerEditModal
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSaved={handleSaved}
      />
    </AppShell>
  )
}
