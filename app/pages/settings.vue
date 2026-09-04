<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold">Settings</h1>

    <section class="rounded-2xl border border-border bg-card p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold">Workspaces</h2>
        <button
          class="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          @click="openCreate"
        >
          <Plus class="h-4 w-4" /> New
        </button>
      </div>

      <p class="mb-4 text-sm text-muted-foreground">
        Workspaces keep budgets separate. You can belong to as many as you need.
      </p>

      <div v-if="workspaces.length === 0" class="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No workspaces yet. Create one to get started.
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="w in workspaces"
          :key="w.id"
          class="flex items-center gap-3 rounded-xl border p-3 transition"
          :class="w.id === workspace?.id ? 'border-brand-600/50 bg-brand-600/5' : 'border-border bg-background'"
        >
          <button
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="switchTo(w)"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              :class="w.id === workspace?.id ? 'bg-brand-600' : 'bg-muted-foreground/40'"
            >
              {{ initial(w.name) }}
            </span>
            <span class="min-w-0">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-semibold">{{ w.name }}</span>
                <span
                  v-if="isOwner(w)"
                  class="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
                >
                  owner
                </span>
              </span>
              <span
                v-if="w.description"
                class="block truncate text-xs text-muted-foreground"
              >
                {{ w.description }}
              </span>
            </span>
          </button>

          <button
            v-if="isOwner(w)"
            type="button"
            aria-label="Edit workspace"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            @click="editWorkspace(w)"
          >
            <Pencil class="h-4 w-4" />
          </button>

          <button
            v-if="isOwner(w)"
            type="button"
            aria-label="Delete workspace"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50"
            :disabled="deletingId === w.id"
            @click="deleteWorkspaceWithConfirm(w)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </li>
      </ul>
    </section>

    <template v-if="workspace">
      <section class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-1 font-semibold">{{ workspace.name }}</h2>
        <p v-if="workspace.description" class="mb-4 text-sm text-muted-foreground">
          {{ workspace.description }}
        </p>
        <p v-else class="mb-4 text-sm text-muted-foreground">
          Invite people to collaborate in this workspace.
        </p>

        <p class="mb-1.5 text-sm font-medium text-muted-foreground">Invite someone by email</p>
        <form class="flex gap-2" @submit.prevent="sendInvite">
          <input
            v-model="inviteEmail"
            type="email"
            required
            autocomplete="email"
            placeholder="teammate@example.com"
            class="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
          <button
            type="submit"
            :disabled="inviting"
            class="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {{ inviting ? 'Inviting…' : 'Invite' }}
          </button>
        </form>
        <p v-if="inviteError" class="mt-2 text-xs text-rose-500">{{ inviteError }}</p>
        <p v-if="inviteSent" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          Invite sent to {{ inviteEmail }}
        </p>

        <div v-if="workspaceInvites.length" class="mt-4">
          <p class="mb-1.5 text-sm font-medium text-muted-foreground">Invitations</p>
          <ul class="space-y-1.5">
            <li
              v-for="inv in workspaceInvites"
              :key="inv.id"
              class="flex items-center justify-between gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm"
            >
              <span class="truncate">{{ inv.email }}</span>
              <span class="flex shrink-0 items-center gap-2">
                <span
                  v-if="inv.status === 'pending'"
                  class="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                >
                  pending
                </span>
                <span v-else class="text-xs text-muted-foreground capitalize">{{ inv.status }}</span>
                <button
                  v-if="inv.status === 'pending'"
                  type="button"
                  aria-label="Revoke invitation"
                  class="rounded-lg p-1 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                  @click="revokeInvite(inv)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-3 font-semibold">Members</h2>
        <p class="text-sm text-muted-foreground">
          {{ membersCount }} member{{ membersCount === 1 ? '' : 's' }} in this workspace.
        </p>
      </section>
    </template>

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

    <WorkspaceDialog v-model:open="dialogOpen" :mode="dialogMode" :workspace="editTarget" @saved="onDialogSaved" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, LogOut, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

const supabase = useSupabase()
const {
  workspace,
  workspaces,
  loadWorkspaces,
  setCurrentWorkspace,
  loadCategories,
  isOwner,
  deleteWorkspace,
} = useWorkspace()
const { user, signOut } = useAuth()
const { workspaceInvites, loadWorkspaceInvites, invite, removeInvitation } = useInvitations()

const membersCount = ref(0)
const inviteEmail = ref('')
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const inviteSent = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function openCreate() {
  dialogMode.value = 'create'
  dialogOpen.value = true
}

function editWorkspace(w: WorkspaceRow) {
  editTarget.value = w
  dialogMode.value = 'edit'
  dialogOpen.value = true
}

const editTarget = ref<WorkspaceRow | null>(null)

const deletingId = ref<string | null>(null)

async function deleteWorkspaceWithConfirm(w: WorkspaceRow) {
  if (deletingId.value) return
  const name = w.name || 'workspace'
  if (!window.confirm(`Delete "${name}"? This permanently removes its transactions, categories, and members.`)) {
    return
  }
  deletingId.value = w.id
  const { error } = await deleteWorkspace(w.id)
  deletingId.value = null
  if (error) {
    alert(error.message)
    return
  }
  if (workspace.value) {
    loadCategories()
    loadMemberCount()
    loadWorkspaceInvites(workspace.value.id)
  }
}

async function switchTo(w: WorkspaceRow) {
  if (w.id === workspace.value?.id) return
  await setCurrentWorkspace(w.id)
  await loadMemberCount()
  await loadWorkspaceInvites(w.id)
}

async function onDialogSaved() {
  await loadWorkspaceList()
  if (workspace.value) {
    await loadCategories()
    await loadMemberCount()
    await loadWorkspaceInvites(workspace.value.id)
  }
}

async function sendInvite() {
  if (!workspace.value) return
  inviteError.value = null
  inviteSent.value = false
  inviting.value = true

  const { error } = await invite(workspace.value.id, inviteEmail.value)

  inviting.value = false
  if (error) {
    inviteError.value = error.message
    return
  }
  inviteSent.value = true
  inviteEmail.value = ''
  await loadWorkspaceInvites(workspace.value.id)
}

async function revokeInvite(inv: (typeof workspaceInvites.value)[number]) {
  await removeInvitation(inv)
}

async function loadMemberCount() {
  if (!workspace.value) return
  const { count } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.value.id)
  membersCount.value = count ?? 0
}

async function loadWorkspaceList() {
  await loadWorkspaces()
}

async function signOutUser() {
  await signOut()
  await navigateTo('/login')
}

onMounted(async () => {
  await loadWorkspaces()
  if (workspace.value) {
    await loadMemberCount()
    await loadWorkspaceInvites(workspace.value.id)
  }
})
</script>
