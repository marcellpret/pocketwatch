<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold">Settings</h1>

    <div v-if="!household" class="rounded-2xl border border-border bg-card p-5 text-center">
      <p class="mb-1 font-medium">No household yet</p>
      <p class="mb-4 text-sm text-muted-foreground">Create a household to start tracking together.</p>
      <button
        class="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700"
        @click="createHousehold"
      >
        Create household
      </button>
    </div>

    <template v-else>
      <section class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-1 font-semibold">Your household</h2>
        <p class="mb-4 text-sm text-muted-foreground">{{ household.name }}</p>

        <p class="mb-1.5 text-sm font-medium text-muted-foreground">Share this code with your partner</p>
        <div class="flex items-center gap-2">
          <div class="flex-1 rounded-xl bg-muted px-4 py-3 text-center text-lg font-bold tracking-[0.35em]">
            {{ household.join_code }}
          </div>
          <button
            class="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background transition hover:bg-muted"
            aria-label="Copy join code"
            @click="copyCode"
          >
            <Copy class="h-5 w-5" />
          </button>
        </div>
        <p class="mt-2 text-xs text-emerald-600 dark:text-emerald-400" v-if="copied">
          Copied!
        </p>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-3 font-semibold">Preferences</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">Currency</p>
            <p class="text-xs text-muted-foreground">Single currency for now</p>
          </div>
          <span class="rounded-lg bg-muted px-3 py-1 text-sm font-semibold">EUR</span>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-3 font-semibold">Household members</h2>
        <p class="text-sm text-muted-foreground">
          {{ membersCount }} member{{ membersCount === 1 ? '' : 's' }} in this household.
        </p>
      </section>
    </template>

    <section class="space-y-2">
      <NuxtLink
        to="/categories"
        class="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium transition hover:bg-muted/60"
      >
        Categories
        <ChevronRight class="h-5 w-5 text-muted-foreground" />
      </NuxtLink>

      <button
        class="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 font-medium text-rose-500 transition hover:bg-rose-500/5"
        @click="signOutUser"
      >
        Sign out
        <LogOut class="h-5 w-5" />
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Copy, LogOut } from 'lucide-vue-next'

const supabase = useSupabase()
const { household, loadHousehold } = useHousehold()
const { user, signOut } = useAuth()

const membersCount = ref(0)
const copied = ref(false)

async function createHousehold() {
  const code = generateJoinCode()
  const { data: h, error } = await supabase
    .from('households')
    .insert({ name: 'Our family', join_code: code })
    .select()
    .single()

  if (error || !user.value) return

  await supabase
    .from('household_members')
    .insert({ household_id: h.id, user_id: user.value.id })

  await loadHousehold()
  await loadMemberCount()
}

async function loadMemberCount() {
  if (!household.value) return
  const { count } = await supabase
    .from('household_members')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', household.value.id)
  membersCount.value = count ?? 0
}

async function copyCode() {
  if (!household.value) return
  try {
    await navigator.clipboard.writeText(household.value.join_code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* ignore clipboard errors */
  }
}

async function signOutUser() {
  await signOut()
  await navigateTo('/login')
}

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

onMounted(async () => {
  await loadHousehold()
  if (household.value) await loadMemberCount()
})
</script>
