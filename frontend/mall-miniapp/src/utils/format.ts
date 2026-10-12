/** 价格格式化：保留两位小数 */
export function formatPrice(value?: number | null): string {
  return Number(value ?? 0).toFixed(2)
}

/** 销量格式化：12345 -> 1.2万 */
export function formatSaleCount(value?: number | null): string {
  const n = Number(value ?? 0)
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万+`
  return String(n)
}
