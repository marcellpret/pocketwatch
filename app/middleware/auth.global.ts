export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']

  if (publicRoutes.includes(to.path)) {
    return
  }

  const supabase = useSupabase()
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    return navigateTo('/login')
  }
})
