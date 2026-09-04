<template>
  <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <h2 class="mb-1 text-xl font-semibold">Welcome back</h2>
    <p class="mb-6 text-sm text-muted-foreground">Sign in to your finances.</p>

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
          autocomplete="current-password"
          class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          placeholder="••••••••"
        />
      </div>

      <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
        {{ error }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      No account yet?
      <NuxtLink to="/register" class="font-medium text-brand-600 hover:underline">
        Create one
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

const { signIn } = useAuth()

async function onSubmit() {
  loading.value = true
  error.value = null
  const { error: err } = await signIn(email.value, password.value)
  loading.value = false

  if (err) {
    error.value = err.message
    return
  }
  await navigateTo('/')
}
</script>
