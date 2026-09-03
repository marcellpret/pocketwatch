import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export function useSupabase(): SupabaseClient<Database> {
  return createSupabaseClient()
}
