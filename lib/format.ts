export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ'
}

export function formatProfit(amount: number): string {
  if (amount === 0) return '0đ'
  const sign = amount > 0 ? '+' : '−'
  return sign + Math.abs(amount).toLocaleString('vi-VN') + 'đ'
}
