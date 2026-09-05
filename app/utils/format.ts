const eur = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
})

const eurNoDecimals = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatAmount(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return eurNoDecimals.format(value)
  }
  return eur.format(value)
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  const y = year ?? new Date().getFullYear()
  const m = month ?? 1
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatDate(iso: string): string {
  const parts = iso.split('T')[0]?.split('-')
  if (parts && parts.length === 3) {
    const [y, m, d] = parts.map(Number)
    if (y && m && d) {
      return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
    }
  }
  const date = new Date(iso)
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
}

export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '')
  const ci = cleaned.lastIndexOf(',')
  const di = cleaned.lastIndexOf('.')
  const lastIdx = Math.max(ci, di)
  if (lastIdx === -1) return cleaned
  const intPart = cleaned.slice(0, lastIdx).replace(/[.,]/g, '')
  const decPart = cleaned.slice(lastIdx + 1).replace(/[.,]/g, '').slice(0, 2)
  return `${intPart}${cleaned[lastIdx]}${decPart}`
}

export function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value
  const raw = value.trim()
  if (!raw) return NaN
  const ci = raw.lastIndexOf(',')
  const di = raw.lastIndexOf('.')
  const lastIdx = Math.max(ci, di)
  if (lastIdx === -1) return Number(raw)
  const intPart = raw.slice(0, lastIdx).replace(/[.,]/g, '')
  const decPart = raw.slice(lastIdx + 1).replace(/[.,]/g, '')
  return Number(`${intPart || '0'}.${decPart}`)
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
