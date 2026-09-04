import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

let browserClient: SupabaseClient<Database> | null = null

export function createSupabaseClient() {
  const config = useRuntimeConfig().public
  const url = config.supabaseUrl as string
  const key = config.supabasePublishableKey as string

  if (import.meta.server) {
    const event = useRequestEvent()
    return createServerClient<Database>(url, key, {
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
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, key)
  }
  return browserClient
}
