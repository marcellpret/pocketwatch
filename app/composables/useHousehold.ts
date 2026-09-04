import type {
  Database,
} from '~/types/database'

type HouseholdRow = Database['public']['Tables']['households']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

export function useHousehold() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const household = useState<HouseholdRow | null>('household', () => null)
  const categories = useState<CategoryRow[]>('household-categories', () => [])
  const loading = useState<boolean>('household-loading', () => false)

  async function loadHousehold(): Promise<HouseholdRow | null> {
    if (!user.value) {
      household.value = null
      return null
    }

    loading.value = true
    const { data, error } = await supabase
      .from('household_members')
      .select('household:households(*)')
      .eq('user_id', user.value.id)
      .maybeSingle()

    loading.value = false

    if (error || !data) {
      household.value = null
      return null
    }

    const h = (data.household as unknown as HouseholdRow) ?? null
    household.value = h
    return h
  }

  async function loadCategories() {
    if (!household.value) return []
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', household.value.id)
      .order('name')

    if (!error) categories.value = data ?? []
    return categories.value
  }

  function isOnboarded() {
    return !!household.value
  }

  return {
    household,
    categories,
    loading,
    loadHousehold,
    loadCategories,
    isOnboarded,
  }
}
