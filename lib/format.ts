export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

export function formatProfit(amount: number): string {
  if (amount === 0) return '0 ₫'
  const sign = amount > 0 ? '+' : '−'
  return sign + Math.abs(amount).toLocaleString('vi-VN') + ' ₫'
}
