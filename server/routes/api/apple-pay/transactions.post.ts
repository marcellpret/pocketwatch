import { defineEventHandler, getHeader, readBody, setResponseStatus } from 'h3'

interface ApplePayPayload {
  amount?: string | number
  merchant?: string
  occurred_on?: string
  currency?: string
  external_ref?: string
}

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null

  if (!token) {
    setResponseStatus(event, 401)
    return { error: 'invalid_token', message: 'Missing or malformed Authorization header.' }
  }

  let body: ApplePayPayload | null = null
  try {
    body = (await readBody(event)) as ApplePayPayload | null
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
  const externalRef = typeof body?.external_ref === 'string' ? body.external_ref.trim().slice(0, 200) : null

  let occurredOn: string | null = null
  if (typeof body?.occurred_on === 'string' && body.occurred_on.trim()) {
    const candidate = body.occurred_on.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      setResponseStatus(event, 400)
      return { error: 'invalid_date', message: 'The "occurred_on" field must be in YYYY-MM-DD format.' }
    }
    occurredOn = candidate
  }

  let currency: string | null = null
  if (typeof body?.currency === 'string' && body.currency.trim()) {
    currency = body.currency.trim().toUpperCase().slice(0, 3)
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase.rpc('webhook_insert_transaction', {
    p_token: token,
    p_amount: amount,
    p_merchant: merchant ?? undefined,
    p_occurred_on: occurredOn ?? undefined,
    p_currency: currency ?? undefined,
    p_external_ref: externalRef ?? undefined,
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