import type { Database } from '~/types/database'

type WebhookTokenRow = Database['public']['Tables']['webhook_tokens']['Row']
type MerchantRuleRow = Database['public']['Tables']['merchant_rules']['Row']
type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

type TokenWithWorkspace = WebhookTokenRow & {
  workspace: Pick<WorkspaceRow, 'id' | 'name'> | null
}

type RecentMerchant = {
  merchant: string
  count: number
  latest: string
}

const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += TOKEN_CHARS[b % TOKEN_CHARS.length]
  return out
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function useApplePay() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const { workspace, workspaces } = useWorkspace()

  const tokens = useState<TokenWithWorkspace[]>('apple-pay-tokens', () => [])
  const rules = useState<MerchantRuleRow[]>('apple-pay-rules', () => [])
  const loading = useState<boolean>('apple-pay-loading', () => false)

  async function loadTokens() {
    if (!user.value) {
      tokens.value = []
      return tokens.value
    }
    const { data, error } = await supabase
      .from('webhook_tokens')
      .select('*, workspace:workspaces(name)')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (!error) tokens.value = (data ?? []) as TokenWithWorkspace[]
    return tokens.value
  }

  async function createToken(workspaceId: string, currency: string) {
    if (!user.value) return { rawToken: null, error: new Error('Not signed in') as Error }

    const rawToken = generateToken()
    const tokenHash = await sha256Hex(rawToken)
    const { error } = await supabase.from('webhook_tokens').insert({
      token_hash: tokenHash,
      user_id: user.value.id,
      workspace_id: workspaceId,
      currency: (currency || 'EUR').trim().toUpperCase().slice(0, 3),
    })

    if (error) return { rawToken: null, error }
    await loadTokens()
    return { rawToken, error: null }
  }

  async function revokeToken(id: string) {
    const { error } = await supabase
      .from('webhook_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) await loadTokens()
    return { error }
  }

  async function loadRules() {
    if (!workspace.value) {
      rules.value = []
      return rules.value
    }
    const { data, error } = await supabase
      .from('merchant_rules')
      .select('*')
      .eq('workspace_id', workspace.value.id)
      .order('created_at', { ascending: false })

    if (!error) rules.value = data ?? []
    return rules.value
  }

  async function createRule(match: string, categoryId: string) {
    if (!workspace.value) return { error: new Error('No workspace selected') as Error }
    const { error } = await supabase.from('merchant_rules').insert({
      workspace_id: workspace.value.id,
      match: match.trim(),
      category_id: categoryId,
    })
    if (!error) await loadRules()
    return { error }
  }

  async function deleteRule(id: string) {
    const { error } = await supabase.from('merchant_rules').delete().eq('id', id)
    if (!error) await loadRules()
    return { error }
  }

  async function recentUnmatchedMerchants(): Promise<RecentMerchant[]> {
    if (!workspace.value) return []

    const { data, error } = await supabase
      .from('transactions')
      .select('description, occurred_on')
      .eq('workspace_id', workspace.value.id)
      .eq('source', 'apple_pay')
      .not('description', 'is', null)
      .order('occurred_on', { ascending: false })
      .limit(100)

    if (error || !data) return []

    const map = new Map<string, { count: number; latest: string }>()
    for (const t of data) {
      const merchant = (t.description as string | null)?.trim() ?? ''
      if (!merchant) continue
      const matched = rules.value.some((r) =>
        merchant.toLowerCase().includes(r.match.toLowerCase()),
      )
      if (matched) continue
      const existing = map.get(merchant)
      const occurred = (t.occurred_on as string).slice(0, 10)
      if (existing) {
        existing.count += 1
        if (occurred > existing.latest) existing.latest = occurred
      } else {
        map.set(merchant, { count: 1, latest: occurred })
      }
    }

    return Array.from(map.entries())
      .map(([merchant, v]) => ({ merchant, ...v }))
      .sort((a, b) => b.latest.localeCompare(a.latest))
  }

  return {
    tokens,
    rules,
    loading,
    loadTokens,
    createToken,
    revokeToken,
    loadRules,
    createRule,
    deleteRule,
    recentUnmatchedMerchants,
    workspaces,
  }
}