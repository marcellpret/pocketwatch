<template>
  <section class="rounded-2xl border border-border bg-card p-5">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-semibold">Apple Pay sync</h2>
      <button
        type="button"
        class="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
        @click="showGuide = !showGuide"
      >
        {{ showGuide ? 'Hide setup guide' : 'Setup guide' }}
      </button>
    </div>

    <p class="mb-4 text-sm text-muted-foreground">
      When you tap to pay, an iPhone Shortcuts automation posts the purchase to this app and it is added to your workspace automatically.
    </p>

    <div v-if="createdToken" class="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p class="mb-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Token created — copy it now</p>
      <p class="mb-3 text-xs text-emerald-600/80 dark:text-emerald-400/80">
        It is stored hashed and will never be shown again. If you lose it, revoke it and generate a new one.
      </p>
      <div class="flex items-center gap-2">
        <code class="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs text-foreground">{{ createdToken }}</code>
        <button
          type="button"
          aria-label="Copy token"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
          @click="copy(createdToken)"
        >
          <Copy class="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
          @click="createdToken = null"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <form class="mb-4 flex flex-wrap gap-2" @submit.prevent="create">
      <select
        v-model="tokenWorkspaceId"
        class="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      >
        <option v-for="w in workspaces" :key="w.id" :value="w.id">{{ w.name }}</option>
      </select>
      <input
        v-model="tokenCurrency"
        type="text"
        maxlength="3"
        placeholder="EUR"
        class="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-center text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      />
      <button
        type="submit"
        :disabled="creating"
        class="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {{ creating ? 'Generating…' : 'Generate token' }}
      </button>
    </form>
    <p v-if="createError" class="mb-3 text-xs text-rose-500">{{ createError }}</p>

    <div v-if="tokens.length" class="space-y-2">
      <div
        v-for="t in tokens"
        :key="t.id"
        class="rounded-xl border border-border p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm font-semibold">{{ t.workspace?.name ?? 'Unnamed workspace' }}</span>
            <span class="text-xs text-muted-foreground">{{ t.currency }}</span>
            <span
              v-if="t.revoked_at"
              class="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-500"
            >
              revoked
            </span>
          </div>
          <button
            v-if="!t.revoked_at"
            type="button"
            class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-50"
            :disabled="revokingId === t.id"
            @click="revoke(t)"
          >
            {{ revokingId === t.id ? 'Revoking…' : 'Revoke' }}
          </button>
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          created {{ formatDate(t.created_at) }}<template v-if="t.last_used_at"> · last used {{ formatDate(t.last_used_at) }}</template>
        </div>
      </div>
    </div>

    <div v-if="showGuide" class="mt-4 rounded-xl bg-muted p-4">
      <p class="mb-2 text-sm font-semibold">Set up the iPhone Shortcut</p>
      <ol class="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>Open the <b>Shortcuts</b> app → <b>Automations</b> → <b>+</b> → <b>Transaction</b>.</li>
        <li>Select <b>When I tap</b>, pick the card you pay with, and choose <b>Run Immediately</b>.</li>
        <li>Add a <b>Text</b> action containing the JSON below and drop the <b>Shortcut Input</b> variables <b>Merchant</b> and <b>Amount</b> into it.</li>
        <li>Add <b>Get Contents of URL</b> pointing at the URL below, method <b>POST</b>, with the headers shown.</li>
      </ol>

      <div class="mt-3 space-y-1.5 text-xs">
        <p><span class="font-semibold">URL</span> — <code class="break-all rounded bg-background px-1.5 py-0.5">{{ baseUrl }}/api/apple-pay/transactions</code></p>
        <p><span class="font-semibold">Method</span> — <code class="rounded bg-background px-1.5 py-0.5">POST</code></p>
        <p><span class="font-semibold">Headers</span> — <code class="rounded bg-background px-1.5 py-0.5">Authorization</code>: <code class="break-all rounded bg-background px-1.5 py-0.5">{{ authHeader }}</code></p>
        <p><span class="font-semibold">Content-Type</span> — <code class="rounded bg-background px-1.5 py-0.5">application/json</code></p>
        <p><span class="font-semibold">Body (JSON)</span></p>
        <pre class="mt-1.5 overflow-x-auto rounded-lg bg-background p-3 text-[11px] leading-relaxed text-foreground">{{ jsonBody }}</pre>
      </div>

      <button
        type="button"
        class="mt-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
        @click="copy(jsonBody)"
      >
        <Copy class="h-3.5 w-3.5" /> Copy body template
      </button>

      <p class="mt-3 text-xs text-muted-foreground">
        Purchases whose merchant matches an auto-categorization rule land in that category; anything else falls back to your "Other"-type expense category.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Copy, X } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type WebhookTokenRow = Database['public']['Tables']['webhook_tokens']['Row']

const { tokens, workspaces, loadTokens, createToken, revokeToken } = useApplePay()
const { user } = useAuth()

const showGuide = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const createdToken = ref<string | null>(null)
const tokenWorkspaceId = ref<string>('')
const tokenCurrency = ref('EUR')
const revokingId = ref<string | null>(null)

const baseUrl = computed(() => {
  if (import.meta.server) return ''
  return window.location.origin
})

const authHeader = computed(() => (createdToken.value ? `Bearer ${createdToken.value}` : 'Bearer <your-token>'))

const jsonBody = computed(() =>
  [
    '{',
    '  "amount": {{Amount}},',
    '  "merchant": "{{Merchant}}"',
    '}',
  ].join('\n'),
)

watch(
  () => workspaces.value,
  (list) => {
    if (!tokenWorkspaceId.value && list.length) tokenWorkspaceId.value = list[0]!.id
  },
  { immediate: true },
)

watchEffect(() => {
  if (user.value) loadTokens()
})

async function create() {
  createError.value = null
  if (!tokenWorkspaceId.value) {
    createError.value = 'Select a workspace first.'
    return
  }
  creating.value = true
  const { rawToken, error } = await createToken(tokenWorkspaceId.value, tokenCurrency.value)
  creating.value = false
  if (error || !rawToken) {
    createError.value = error?.message ?? 'Could not create the token.'
    return
  }
  createdToken.value = rawToken
  showGuide.value = true
}

async function revoke(t: WebhookTokenRow) {
  revokingId.value = t.id
  const { error } = await revokeToken(t.id)
  revokingId.value = null
  if (error) createError.value = error.message
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
}
</script>