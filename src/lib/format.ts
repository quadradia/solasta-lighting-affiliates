import { locale } from '@/i18n'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale(), { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatNumber(value: number): string {
  return value.toLocaleString(locale())
}

/** Signed Bucks amount: +10, −100. */
export function formatSigned(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : value < 0 ? `−${formatNumber(Math.abs(value))}` : '0'
}
