import { defineEventHandler, getHeader, readBody, setResponseStatus } from 'h3'

interface ReceiptPayload {
  merchant?: string
  date?: string
  amount?: string | number
}

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null

  if (!token) {
    setResponseStatus(event, 401)
    return { error: 'invalid_token', message: 'Missing or malformed Authorization header.' }
  }

  let body: ReceiptPayload | null = null
  try {
    body = (await readBody(event)) as ReceiptPayload | null
  } catch {
    setResponseStatus(event, 400)
    return { error: 'invalid_body', message: 'Request body must be valid JSON.' }
  }

  const rawAmount = body?.amount
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    setResponseStatus(event, 400)
    return { error: 'invalid_amount', message: 'The "amount" field is required.' }
  }

  const amount = parseWebhookAmount(rawAmount)
  if (!Number.isFinite(amount) || amount <= 0) {
    setResponseStatus(event, 400)
    return { error: 'invalid_amount', message: 'The "amount" field must be a positive number.' }
  }

  const merchant = typeof body?.merchant === 'string' ? body.merchant.trim().slice(0, 300) : null

  let occurredOn: string | null = null
  if (typeof body?.date === 'string' && body.date.trim()) {
    const candidate = body.date.trim()
    const ddmmyyyy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(candidate)
    if (ddmmyyyy) {
      occurredOn = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      occurredOn = candidate
    } else {
      setResponseStatus(event, 400)
      return { error: 'invalid_date', message: 'The "date" field must be in DD.MM.YYYY or YYYY-MM-DD format.' }
    }
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase.rpc('webhook_insert_transaction', {
    p_token: token,
    p_amount: amount,
    p_merchant: merchant ?? undefined,
    p_occurred_on: occurredOn ?? undefined,
    p_source: 'receipt',
  })

  if (error) {
    const message = error.message ?? ''
    if (message.includes('INVALID_TOKEN')) {
      setResponseStatus(event, 401)
      return { error: 'invalid_token', message: 'Unknown or revoked token.' }
    }
    if (message.includes('INVALID_AMOUNT')) {
      setResponseStatus(event, 400)
      return { error: 'invalid_amount', message: 'The "amount" field must be a positive number.' }
    }
    if (message.includes('NO_CATEGORY')) {
      setResponseStatus(event, 422)
      return { error: 'no_category', message: 'The workspace has no expense category to receive the transaction.' }
    }
    setResponseStatus(event, 500)
    return { error: 'server_error', message: 'Unexpected server error.' }
  }

  return { ok: true, transaction: data }
})