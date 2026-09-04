<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger
      class="flex max-w-[11rem] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground outline-none transition hover:bg-muted"
    >
      <span class="truncate">{{ workspace?.name ?? 'Select workspace' }}</span>
      <ChevronsUpDown class="h-4 w-4 shrink-0 text-muted-foreground" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        :side-offset="6"
        class="z-50 w-56 rounded-xl border border-border bg-card py-1 shadow-lg"
      >
        <DropdownMenuLabel class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>

        <DropdownMenuItem
          v-for="w in workspaces"
          :key="w.id"
          class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
          @select="select(w)"
        >
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="w.id === workspace?.id ? 'bg-brand-600' : 'bg-muted-foreground/40'" />
          <span class="flex-1 truncate">{{ w.name }}</span>
          <Check v-if="w.id === workspace?.id" class="h-4 w-4 shrink-0 text-brand-600" />
        </DropdownMenuItem>

        <DropdownMenuSeparator class="my-1 h-px bg-border" />

        <DropdownMenuItem
          class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 outline-none hover:bg-muted"
          @select="onCreate"
        >
          <Plus class="h-4 w-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>

  <WorkspaceDialog v-model:open="createOpen" mode="create" @saved="onDialogSaved" />
</template>

<script setup lang="ts">
import { Check, ChevronsUpDown, Plus } from 'lucide-vue-next'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'

const { workspace, workspaces, setCurrentWorkspace } = useWorkspace()

const createOpen = ref(false)

async function select(w: (typeof workspaces.value)[number]) {
  if (w.id === workspace.value?.id) return
  await setCurrentWorkspace(w.id)
  await navigateTo('/')
}

function onCreate() {
  createOpen.value = true
}

async function onDialogSaved() {
  await navigateTo('/')
}
</script>
