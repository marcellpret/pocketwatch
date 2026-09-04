import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie } from 'h3'
import type { Database } from '~/types/database'

export function createSupabaseClient() {
  const config = useRuntimeConfig().public
  const url = config.supabaseUrl as string
  const key = config.supabasePublishableKey as string

  if (import.meta.server) {
    const event = useRequestEvent()
    const client = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          if (!event) return []
          const cookies = parseCookies(event)
          return Object.entries(cookies).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          if (!event) return
          for (const { name, value, options } of cookiesToSet) {
            setCookie(event, name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          }
        },
      },
    })
    return client
  }

  return createBrowserClient<Database>(url, key)
}
