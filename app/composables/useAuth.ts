import type { User, Session } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)

export function useAuth() {
  const supabase = useSupabase()

  async function refresh() {
    const { data } = await supabase.auth.getSession()
    syncFromSession(data.session)
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