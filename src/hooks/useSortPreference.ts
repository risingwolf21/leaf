import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { SortBy } from '@/types'

const DEFAULT_SORT: SortBy = 'updated_at'
const VALID_SORTS: SortBy[] = ['updated_at', 'created_at', 'title_asc', 'title_desc']

function storageKey(userId: string) {
  return `leaf-sort-${userId}`
}

/** Type guard for a sort preference read back from localStorage, which may predate a schema change. */
function isSortBy(value: string): value is SortBy {
  return VALID_SORTS.some((sort) => sort === value)
}

/** Persists the note list sort preference to localStorage, scoped per user. */
export function useSortPreference() {
  const { user } = useAuth()
  const [sortBy, setSortByState] = useState<SortBy>(DEFAULT_SORT)

  useEffect(() => {
    if (!user) return

    const stored = localStorage.getItem(storageKey(user.id))
    if (stored && isSortBy(stored)) {
      setSortByState(stored)
    }
  }, [user])

  const setSortBy = (next: SortBy) => {
    setSortByState(next)
    if (user) localStorage.setItem(storageKey(user.id), next)
  }

  return [sortBy, setSortBy] as const
}
