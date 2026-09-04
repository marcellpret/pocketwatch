import type { Database } from '~/types/database'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const CURRENT_WORKSPACE_KEY = 'pocketwatch:current-workspace'

export function useWorkspace() {
  const supabase = useSupabase()
  const { user } = useAuth()

  const workspaces = useState<WorkspaceRow[]>('workspaces', () => [])
  const workspace = useState<WorkspaceRow | null>('workspace', () => null)
  const categories = useState<CategoryRow[]>('workspace-categories', () => [])
  const loading = useState<boolean>('workspace-loading', () => false)

  function persistCurrentWorkspaceId(id: string | null) {
    if (import.meta.client) {
      if (id) localStorage.setItem(CURRENT_WORKSPACE_KEY, id)
      else localStorage.removeItem(CURRENT_WORKSPACE_KEY)
    }
  }

  function pickCurrentWorkspace(): WorkspaceRow | null {
    if (!workspaces.value.length) return null
    if (import.meta.client) {
      const savedId = localStorage.getItem(CURRENT_WORKSPACE_KEY)
      const saved = workspaces.value.find((w) => w.id === savedId)
      if (saved) return saved
    }
    return workspaces.value[0]!
  }

  async function loadWorkspaces(): Promise<WorkspaceRow[]> {
    if (!user.value) {
      workspaces.value = []
      workspace.value = null
      return workspaces.value
    }

    loading.value = true
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace:workspaces(*)')
      .eq('user_id', user.value.id)

    loading.value = false

    if (error || !data) {
      workspaces.value = []
      workspace.value = null
      return workspaces.value
    }

    const list = data
      .map((row) => (row.workspace as unknown as WorkspaceRow | null))
      .filter((w): w is WorkspaceRow => Boolean(w))
      .sort((a, b) => a.name.localeCompare(b.name))

    workspaces.value = list
    workspace.value = pickCurrentWorkspace()
    return workspaces.value
  }

  async function setCurrentWorkspace(id: string) {
    const next = workspaces.value.find((w) => w.id === id) ?? null
    if (next) {
      workspace.value = next
      persistCurrentWorkspaceId(next.id)
      await loadCategories()
    }
  }

  async function loadCategories() {
    if (!workspace.value) {
      categories.value = []
      return categories.value
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', workspace.value.id)
      .order('name')

    if (!error) categories.value = data ?? []
    return categories.value
  }

  async function createWorkspace(input: { name: string; description?: string }) {
    if (!user.value) return { error: new Error('Not signed in') as Error }

    const code = generateJoinCode()
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        join_code: code,
        owner_id: user.value.id,
      })
      .select()
      .single()

    if (error || !ws) return { error: error ?? (new Error('Could not create workspace') as Error) }

    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.value.id,
    })

    await loadWorkspaces()
    workspace.value = ws
    persistCurrentWorkspaceId(ws.id)
    await loadCategories()

    return { error: null }
  }

  async function updateWorkspace(input: { id: string; name: string; description?: string | null }) {
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        name: input.name.trim(),
        description: input.description?.trim() ? input.description.trim() : null,
      })
      .eq('id', input.id)
      .select()
      .single()

    if (!error && data && workspace.value?.id === data.id) {
      workspace.value = data as WorkspaceRow
    }
    if (!error) await loadWorkspaces()
    return { error, data }
  }

  async function deleteWorkspace(id: string): Promise<{ error: Error | null }> {
    if (!user.value) return { error: new Error('Not signed in') as Error }

    const { error } = await supabase.rpc('delete_workspace', { p_workspace_id: id })
    if (error) return { error: error as Error }

    workspaces.value = workspaces.value.filter((w) => w.id !== id)

    if (workspace.value?.id === id) {
      persistCurrentWorkspaceId(null)
      workspace.value = pickCurrentWorkspace()
      await loadCategories()
    }

    return { error: null }
  }

  function isOwner(ws: WorkspaceRow | null = workspace.value) {
    return !!ws && !!user.value && ws.owner_id === user.value.id
  }

  function isOnboarded() {
    return !!workspace.value
  }

  return {
    workspaces,
    workspace,
    categories,
    loading,
    loadWorkspaces,
    setCurrentWorkspace,
    loadCategories,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    isOwner,
    isOnboarded,
  }
}

function generateJoinCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
