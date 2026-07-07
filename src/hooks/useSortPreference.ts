import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createStore } from '@/lib/sidebarStore'
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

const sortByStore = createStore<SortBy>(DEFAULT_SORT)
let hydratedForUserId: string | null = null

/**
 * Shared note-list sort preference, persisted to localStorage per user. Backed
 * by an external store (not local state) since the sidebar's file tree and the
 * note-list panel each call this hook independently and must stay in sync.
 */
export function useSortPreference() {
  const { user } = useAuth()
  const sortBy = useSyncExternalStore(sortByStore.subscribe, sortByStore.getSnapshot)

  useEffect(() => {
    if (!user || hydratedForUserId === user.id) return
    hydratedForUserId = user.id

    const stored = localStorage.getItem(storageKey(user.id))
    if (stored && isSortBy(stored)) {
      sortByStore.setState(stored)
    }
  }, [user])

  const setSortBy = (next: SortBy) => {
    sortByStore.setState(next)
    if (user) localStorage.setItem(storageKey(user.id), next)
  }

  return [sortBy, setSortBy] as const
}
