/** Format số tiền/cá với dấu phân cách hàng nghìn (vi-VN: 50.000) */
export function formatMoney(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return ''
  const num = typeof value === 'number' ? value : parseMoneyInput(String(value))
  if (Number.isNaN(num)) return ''
  return num.toLocaleString('vi-VN')
}

/** Parse chuỗi đã format (2.000, 50.000) về số nguyên */
export function parseMoneyInput(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d-]/g, '')
  if (cleaned === '' || cleaned === '-') return 0
  const num = Number(cleaned)
  return Number.isNaN(num) ? 0 : num
}

/** Props dùng chung cho mọi InputNumber nhập tiền/cá */
export const MONEY_INPUT_PROPS = {
  formatter: (value: string | number | undefined) => formatMoney(value),
  parser: (displayValue: string | undefined) => parseMoneyInput(displayValue),
  controls: false as const,
}
