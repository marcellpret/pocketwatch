import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useSupabase()

  const user = ref<User | null>(null)
  const loading = ref(true)

  async function refresh() {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (session?.user) {
      user.value = session.user
    } else {
      user.value = null
    }
    return user.value
  }

  async function handleAuthChange(_event: string, session: Session | null) {
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
    supabase.auth.onAuthStateChange(handleAuthChange)
    await refresh()
    loading.value = false
  }

  return {
    user,
    loading,
    init,
    refresh,
    signIn,
    signUp,
    signOut,
  }
}
