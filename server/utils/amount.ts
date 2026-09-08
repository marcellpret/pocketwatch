export function parseWebhookAmount(value: string | number): number {
  if (typeof value === 'number') return value
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return NaN
  const ci = cleaned.lastIndexOf(',')
  const di = cleaned.lastIndexOf('.')
  const lastIdx = Math.max(ci, di)
  if (lastIdx === -1) return Number(cleaned)
  const intPart = cleaned.slice(0, lastIdx).replace(/[.,]/g, '')
  const decPart = cleaned.slice(lastIdx + 1).replace(/[.,]/g, '')
  return Number(`${intPart || '0'}.${decPart}`)
}