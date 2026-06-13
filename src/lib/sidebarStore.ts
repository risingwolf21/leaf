import { useCallback, useSyncExternalStore } from 'react'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'

export type SidebarMode = 'files' | 'search' | 'tags'

function createStore<T>(initialValue: T) {
  let state = initialValue
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setState: (next: T | ((prev: T) => T)) => {
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
      listeners.forEach((listener) => listener())
    },
  }
}

const sidebarModeStore = createStore<SidebarMode>('files')

/** Cross-page sidebar mode (files/search/tags), shared without a context provider. */
export function useSidebarMode() {
  const mode = useSyncExternalStore(sidebarModeStore.subscribe, sidebarModeStore.getSnapshot)
  return [mode, sidebarModeStore.setState] as const
}

const tagFilterStore = createStore<Set<string>>(new Set())

/** Cross-page tag filter for the Files sidebar, shared without a context provider. */
export function useTagFilter() {
  const tagFilter = useSyncExternalStore(tagFilterStore.subscribe, tagFilterStore.getSnapshot)

  const toggleTagFilter = useCallback((tagId: string) => {
    tagFilterStore.setState((prev) => {
      if (tagId === UNTAGGED_FILTER_ID) {
        return prev.has(UNTAGGED_FILTER_ID) ? new Set() : new Set([UNTAGGED_FILTER_ID])
      }

      const next = new Set(prev)
      next.delete(UNTAGGED_FILTER_ID)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }, [])

  const clearTagFilter = useCallback(() => tagFilterStore.setState(new Set()), [])

  return { tagFilter, toggleTagFilter, clearTagFilter }
}

type PendingRename = { kind: 'folder' | 'note'; id: string } | null

const pendingRenameStore = createStore<PendingRename>(null)

/**
 * Signal used to auto-enter rename mode immediately after creating a folder
 * or note from the sidebar action bar.
 */
export function usePendingRename() {
  const pendingRename = useSyncExternalStore(pendingRenameStore.subscribe, pendingRenameStore.getSnapshot)
  return { pendingRename, setPendingRename: pendingRenameStore.setState }
}

const SIDEBAR_STORAGE_KEY = 'leaf-sidebar'

const sidebarOpenStore = createStore<boolean>(localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'closed')

/** Desktop sidebar open/collapsed state, persisted to localStorage and shared without a context provider. */
export function useSidebarOpen() {
  const sidebarOpen = useSyncExternalStore(sidebarOpenStore.subscribe, sidebarOpenStore.getSnapshot)

  const toggleSidebar = useCallback(() => {
    sidebarOpenStore.setState((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'open' : 'closed')
      return next
    })
  }, [])

  return { sidebarOpen, toggleSidebar }
}
