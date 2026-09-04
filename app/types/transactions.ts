import type { Database } from '~/types/database'

export type TransactionRow = Database['public']['Tables']['transactions']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']

// Result of selecting a transaction with its joined category
export type TransactionWithCategory = TransactionRow & {
  category: Pick<CategoryRow, 'id' | 'name' | 'color'> | null
}
