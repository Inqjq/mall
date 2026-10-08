/** 将接口时间转换为浏览器本地时区的可读格式。 */
export function formatDateTime(value: unknown): string {
  if (value == null || value === '') return '—'
  const source = value instanceof Date ? value : new Date(typeof value === 'string' && !value.includes('T') ? value.replace(' ', 'T') : String(value))
  if (!Number.isFinite(source.getTime())) return String(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${source.getFullYear()}-${pad(source.getMonth() + 1)}-${pad(source.getDate())} ${pad(source.getHours())}:${pad(source.getMinutes())}:${pad(source.getSeconds())}`
}
