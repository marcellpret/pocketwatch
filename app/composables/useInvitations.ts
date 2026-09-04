import type { Database } from '~/types/database'

type InvitationRow = Database['public']['Tables']['workspace_invitations']['Row']

export function useInvitations() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const { loadWorkspaces } = useWorkspace()

  const workspaceInvites = useState<InvitationRow[]>('workspace-invites', () => [])
  const myPendingInvites = useState<InvitationRow[]>('my-pending-invites', () => [])
  const loading = useState<boolean>('invitations-loading', () => false)

  async function loadWorkspaceInvites(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (!error) workspaceInvites.value = data ?? []
    return workspaceInvites.value
  }

  async function loadMyPendingInvites() {
    if (!user.value) {
      myPendingInvites.value = []
      return myPendingInvites.value
    }
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!error) myPendingInvites.value = data ?? []
    return myPendingInvites.value
  }

  async function invite(workspaceId: string, email: string) {
    if (!user.value) return { error: new Error('Not signed in') as Error }
    const { error } = await supabase.from('workspace_invitations').insert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      invited_by: user.value.id,
    })
    return { error }
  }

  async function accept(invite: InvitationRow) {
    if (!user.value) return { error: new Error('Not signed in') as Error }

    const { error } = await supabase.rpc('accept_invitation', { p_invite_id: invite.id })
    if (error) return { error }

    myPendingInvites.value = myPendingInvites.value.filter((i) => i.id !== invite.id)
    await loadWorkspaces()
    return { error: null }
  }

  async function decline(invite: InvitationRow) {
    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'declined' })
      .eq('id', invite.id)

    if (!error) {
      myPendingInvites.value = myPendingInvites.value.filter((i) => i.id !== invite.id)
    }
    return { error }
  }

  async function removeInvitation(invite: InvitationRow) {
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invite.id)

    if (!error) {
      workspaceInvites.value = workspaceInvites.value.filter((i) => i.id !== invite.id)
      myPendingInvites.value = myPendingInvites.value.filter((i) => i.id !== invite.id)
    }
    return { error }
  }

  return {
    workspaceInvites,
    myPendingInvites,
    loading,
    loadWorkspaceInvites,
    loadMyPendingInvites,
    invite,
    accept,
    decline,
    removeInvitation,
  }
}
