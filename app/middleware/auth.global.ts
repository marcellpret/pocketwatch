export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']

  if (publicRoutes.includes(to.path)) {
    return
  }

  const supabase = useSupabase()
  const { syncFromSession } = useAuth()

  const { data } = await supabase.auth.getSession()
  syncFromSession(data.session)

  if (!data.session) {
    return navigateTo('/login')
  }
})