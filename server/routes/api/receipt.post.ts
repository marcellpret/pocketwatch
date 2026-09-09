import { defineEventHandler, readBody, setResponseStatus } from 'h3'

interface ReceiptPayload {
  merchant?: string
  date?: string
  amount?: string | number
}

export default defineEventHandler(async (event) => {
  let body: ReceiptPayload | null = null
  try {
    body = (await readBody(event)) as ReceiptPayload | null
  } catch {
    setResponseStatus(event, 400)
    return { error: 'invalid_body', message: 'Request body must be valid JSON.' }
  }

  console.log('[Receipt Shortcut] Received payload:', JSON.stringify(body, null, 2))

  return { ok: true }
})