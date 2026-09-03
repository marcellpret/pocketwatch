<template>
  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-1 text-xl font-semibold">Create your account</h2>
    <p class="mb-6 text-sm text-muted-foreground">Start tracking your family finances.</p>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <label for="email" class="mb-1.5 block text-sm font-medium">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label for="password" class="mb-1.5 block text-sm font-medium">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label for="joinCode" class="mb-1.5 block text-sm font-medium">
          Join code <span class="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="joinCode"
          v-model="joinCode"
          type="text"
          autocomplete="off"
          class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          placeholder="Join your partner's household"
        />
      </div>

      <p class="text-xs text-muted-foreground">
        Tip: leave the join code empty to create a new household for your family, then share its code from
        Settings.
      </p>

      <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
        {{ error }}
      </p>

      <div
        v-if="pendingEmailConfirmation"
        class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      >
        Your account was created. Please check <strong>{{ email }}</strong> to confirm your email, then
        <NuxtLink to="/login" class="font-semibold underline">sign in</NuxtLink>.
      </div>

      <button
        v-else
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-brand-600 hover:underline">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const joinCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const pendingEmailConfirmation = ref(false)

const { signUp } = useAuth()
const supabase = useSupabase()

async function onSubmit() {
  loading.value = true
  error.value = null
  pendingEmailConfirmation.value = false

  const { data, error: signUpErr } = await signUp(email.value, password.value)
  if (signUpErr) {
    loading.value = false
    error.value = signUpErr.message
    return
  }

  const userId = data.user?.id
  const session = data.session
  if (!userId) {
    loading.value = false
    if (data.user?.identities?.length === 0) {
      error.value = 'This email is already registered. Try signing in.'
    } else {
      error.value = 'Could not create account.'
    }
    return
  }

  // If signUp didn't return a session, the user must confirm their email first.
  if (!session) {
    loading.value = false
    pendingEmailConfirmation.value = true
    return
  }

  try {
    if (joinCode.value.trim()) {
      await joinExistingHousehold(userId, joinCode.value.trim())
    } else {
      await createHousehold(userId)
    }
  } catch (e) {
    loading.value = false
    error.value = (e as Error).message
    return
  }

  loading.value = false
  await navigateTo('/')
}

async function createHousehold(userId: string) {
  const code = generateJoinCode()
  const { data: household, error: householdErr } = await supabase
    .from('households')
    .insert({ name: 'Our family', join_code: code })
    .select()
    .single()

  if (householdErr) throw new Error(householdErr.message)

  const { error: memberErr } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId })
  if (memberErr) throw new Error(memberErr.message)

  await seedDefaultCategories(household.id)
}

async function joinExistingHousehold(userId: string, code: string) {
  const { data: household, error: householdErr } = await supabase
    .from('households')
    .select()
    .eq('join_code', code)
    .maybeSingle()

  if (householdErr) throw new Error(householdErr.message)
  if (!household) throw new Error('That join code was not found.')

  const { error: memberErr } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId })
  if (memberErr) throw new Error(memberErr.message)
}

async function seedDefaultCategories(householdId: string) {
  const defaults = [
    { name: 'Groceries', type: 'expense' },
    { name: 'Dining out', type: 'expense' },
    { name: 'Transport', type: 'expense' },
    { name: 'Utilities', type: 'expense' },
    { name: 'Rent', type: 'expense' },
    { name: 'Shopping', type: 'expense' },
    { name: 'Health', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Other', type: 'expense' },
    { name: 'Salary', type: 'income' },
    { name: 'Other income', type: 'income' },
  ]
  await supabase.from('categories').insert(
    defaults.map((c) => ({ ...c, household_id: householdId })),
  )
}

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
</script>
