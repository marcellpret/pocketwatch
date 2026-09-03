import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie } from 'h3'
import type { Database } from '~/types/database'

const url = useRuntimeConfig().public.supabaseUrl as string
const key = useRuntimeConfig().public.supabasePublishableKey as string

export function createSupabaseClient() {
  const isServer = import.meta.server

  if (isServer) {
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
    // Cache the client for the lifetime of this request
    if (event && !event.context.supabase) {
      event.context.supabase = client
    }
    return client
  }

  return createBrowserClient<Database>(url, key)
}
