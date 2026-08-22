export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

/** Số ngày còn lại trước khi TTL xóa vĩnh viễn đơn trong thùng rác (làm tròn lên, tối thiểu 0). */
export function trashDaysLeft(deletedAt: string | Date, retentionDays: number): number {
  const deleted = new Date(deletedAt).getTime()
  const expiresAt = deleted + retentionDays * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
}

export function formatProfit(amount: number): string {
  if (amount === 0) return '0đ'
  const sign = amount > 0 ? '+' : '−'
  return sign + Math.abs(amount).toLocaleString('vi-VN') + 'đ'
}
