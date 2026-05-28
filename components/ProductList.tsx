'use client'

import { AlertCircle, Edit, Package, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Product } from '@/lib/types'
import { formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  loading: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

export default function ProductList({
  products,
  onEdit,
  onDelete,
  loading,
  selectedIds,
  onSelectionChange,
}: ProductListProps) {
  const selectable = !!onSelectionChange

  const toggleOne = (id: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectionChange(next)
  }

  const toggleAll = () => {
    if (!onSelectionChange || !selectedIds) return
    const allOnPage = products.map((p) => p._id)
    const allSelected = allOnPage.every((id) => selectedIds.has(id))
    if (allSelected) {
      const next = new Set(selectedIds)
      allOnPage.forEach((id) => next.delete(id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      allOnPage.forEach((id) => next.add(id))
      onSelectionChange(next)
    }
  }

  const allOnPageSelected = products.length > 0 && products.every((p) => selectedIds?.has(p._id))
  const someOnPageSelected = products.some((p) => selectedIds?.has(p._id))
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-muted animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Chưa có sản phẩm</p>
          <p className="text-xs mt-0.5 text-muted-foreground/70">
            Thêm sản phẩm đầu tiên để bắt đầu
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            {selectable && (
              <TableHead className="pl-4 w-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  checked={allOnPageSelected}
                  ref={(el) => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected }}
                  onChange={toggleAll}
                  aria-label="Chọn tất cả"
                />
              </TableHead>
            )}
            <TableHead className="pl-4 w-16" />
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Giá vốn</TableHead>
            <TableHead className="text-right">Giá bán</TableHead>
            <TableHead className="text-right">Tồn kho</TableHead>
            <TableHead className="text-right pr-4">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const margin =
              product.originalPrice > 0
                ? (
                    ((product.sellingPrice - product.originalPrice) /
                      product.originalPrice) *
                    100
                  ).toFixed(0)
                : null
            const isSelected = selectedIds?.has(product._id) ?? false

            return (
              <TableRow
                key={product._id}
                className={cn('align-middle', isSelected && 'bg-primary/5')}
                onClick={selectable ? () => toggleOne(product._id) : undefined}
                style={selectable ? { cursor: 'pointer' } : undefined}
              >
                {/* Checkbox */}
                {selectable && (
                  <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleOne(product._id)}
                      aria-label={`Chọn ${product.name}`}
                    />
                  </TableCell>
                )}
                {/* Ảnh */}
                <TableCell className="pl-4 py-3">
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Tên + brand + type + ID */}
                <TableCell className="py-3">
                  <p className="font-semibold text-sm truncate max-w-52">{product.name}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {product.brand && (
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {product.brand}
                      </span>
                    )}
                    {product.type && (
                      <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {product.type}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-1.5">
                    #{product._id.slice(-6).toUpperCase()}
                  </p>
                </TableCell>

                {/* Giá vốn */}
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatVND(product.originalPrice)}
                </TableCell>

                {/* Giá bán + margin */}
                <TableCell className="text-right">
                  <p className="text-sm font-semibold">{formatVND(product.sellingPrice)}</p>
                  {margin !== null && (
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        Number(margin) >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive',
                      )}
                    >
                      {Number(margin) >= 0 ? '+' : ''}
                      {margin}%
                    </span>
                  )}
                </TableCell>

                {/* Tồn kho */}
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    {([['HN', product.stockHN], ['QB', product.stockQB], ['SG', product.stockSG]] as const).map(([label, qty]) => {
                      const low  = (qty ?? 0) < 20
                      const zero = (qty ?? 0) === 0
                      return (
                        <div key={label} className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground w-6 text-right">{label}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[11px] min-w-8 justify-center gap-0.5',
                              zero ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                : low  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                       : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                            )}
                          >
                            {zero && <AlertCircle className="h-2.5 w-2.5" />}
                            {qty ?? 0}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </TableCell>

                {/* Thao tác */}
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => onEdit(product)}
                      title="Chỉnh sửa sản phẩm"
                      className="hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-blue-400"
                    >
                      <Edit />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => onDelete(product._id)}
                      title="Xóa sản phẩm"
                      className="hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {products.length} sản phẩm
          {products.filter((p) => p.stock < 10).length > 0 && (
            <span className="ml-2 text-red-500">
              · {products.filter((p) => p.stock < 10).length} nguy hiểm
            </span>
          )}
          {products.filter((p) => p.stock >= 10 && p.stock < 20).length > 0 && (
            <span className="ml-2 text-amber-500">
              · {products.filter((p) => p.stock >= 10 && p.stock < 20).length} sắp hết
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
