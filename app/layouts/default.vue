<template>
  <div class="min-h-dvh flex flex-col">
    <header
      class="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur"
    >
      <div class="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <div class="flex min-w-0 items-center gap-2">
          <button class="flex shrink-0 items-center" @click="navigateTo('/')">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
              <span class="text-base">🕰️</span>
            </span>
          </button>
          <WorkspaceSwitcher />
        </div>
        <button
          type="button"
          aria-label="Toggle theme"
          class="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
          @click="toggleTheme"
        >
          <ClientOnly>
            <Sun v-if="isDark" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </ClientOnly>
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
      <slot />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div class="mx-auto grid w-full max-w-md grid-cols-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2.5 text-xs transition"
          :class="route.path === item.to ? 'text-brand-600' : 'text-muted-foreground'"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { Home, List, PlusCircle, Settings } from 'lucide-vue-next'
import { Moon, Sun } from 'lucide-vue-next'

const route = useRoute()
const { toggleTheme, isDark } = useTheme()
const { loadWorkspaces } = useWorkspace()

const navItems = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Activity', to: '/transactions', icon: List },
  { label: 'Add', to: '/add', icon: PlusCircle },
  { label: 'More', to: '/settings', icon: Settings },
]

onMounted(() => {
  loadWorkspaces()
})
</script>
