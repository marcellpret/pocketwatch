export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']

  if (publicRoutes.includes(to.path)) {
    return
  }

  const { refresh } = useAuth()

  const user = await refresh()

  if (!user) {
    return navigateTo('/login')
  }
})