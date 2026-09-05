<template>
  <div class="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
    <button
      type="button"
      aria-label="Toggle theme"
      class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
      @click="toggleTheme"
    >
      <ClientOnly>
        <Sun v-if="isDark" class="h-5 w-5" />
        <Moon v-else class="h-5 w-5" />
      </ClientOnly>
    </button>

    <div class="mb-8 flex flex-col items-center gap-2">
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white">
        🕰️
      </span>
      <h1 class="text-2xl font-bold text-foreground">Pocketwatch</h1>
      <p class="text-sm text-muted-foreground">Track your money, together.</p>
    </div>

    <div class="w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const { toggleTheme, isDark } = useTheme()
</script>
