import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export function createServerSupabase(): SupabaseClient<Database> {
  const config = useRuntimeConfig().public
  const url = config.supabaseUrl as string
  const key = config.supabasePublishableKey as string
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}