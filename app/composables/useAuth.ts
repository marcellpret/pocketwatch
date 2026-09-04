import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useSupabase()
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  async function refresh() {
    if (import.meta.server) {
      const { data, error } = await supabase.auth.getUser()
      user.value = error ? null : data.user
    } else {
      const { data } = await supabase.auth.getSession()
      user.value = data.session?.user ?? null
    }
    return user.value
  }

  function syncFromSession(session: Session | null) {
    user.value = session?.user ?? null
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    user.value = null
    return { error }
  }

  async function init() {
    loading.value = true
    supabase.auth.onAuthStateChange((_e, session) => syncFromSession(session))
    await refresh()
    loading.value = false
  }

  return { user, loading, init, refresh, syncFromSession, signIn, signUp, signOut }
}
