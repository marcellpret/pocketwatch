<template>
  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-1 text-xl font-semibold">Create your account</h2>
    <p class="mb-6 text-sm text-muted-foreground">Start tracking your finances.</p>

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
const loading = ref(false)
const error = ref<string | null>(null)
const pendingEmailConfirmation = ref(false)

const { signUp } = useAuth()

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

  loading.value = false
  await navigateTo('/')
}
</script>
