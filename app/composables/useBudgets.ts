import type { Database } from '~/types/database'

type BudgetRow = Database['public']['Tables']['budgets']['Row']

export function useBudgets() {
  const supabase = useSupabase()
  const { workspace } = useWorkspace()

  const budgets = useState<BudgetRow[]>('workspace-budgets', () => [])

  async function loadBudgets(): Promise<BudgetRow[]> {
    if (!workspace.value) {
      budgets.value = []
      return budgets.value
    }
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('workspace_id', workspace.value.id)
    if (!error) budgets.value = data ?? []
    return budgets.value
  }

  async function upsertBudget(categoryId: string, amount: number) {
    if (!workspace.value) return { error: new Error('No workspace selected') as Error }
    const { error } = await supabase
      .from('budgets')
      .upsert(
        { workspace_id: workspace.value.id, category_id: categoryId, amount },
        { onConflict: 'workspace_id,category_id' },
      )
    if (!error) await loadBudgets()
    return { error }
  }

  async function removeBudget(categoryId: string) {
    if (!workspace.value) return { error: new Error('No workspace selected') as Error }
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('workspace_id', workspace.value.id)
      .eq('category_id', categoryId)
    if (!error) await loadBudgets()
    return { error }
  }

  function budgetFor(categoryId: string): BudgetRow | undefined {
    return budgets.value.find((b) => b.category_id === categoryId)
  }

  return {
    budgets,
    loadBudgets,
    upsertBudget,
    removeBudget,
    budgetFor,
  }
}