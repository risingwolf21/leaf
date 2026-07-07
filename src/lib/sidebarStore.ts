import { useCallback, useSyncExternalStore } from 'react'
import type { Note } from '@/types'

export function createStore<T>(initialValue: T) {
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

export type PendingRename = { kind: 'folder' | 'note'; id: string } | null

const pendingRenameStore = createStore<PendingRename>(null)

/**
 * Signal used to auto-enter rename mode immediately after creating a folder
 * or note from the sidebar action bar.
 */
export function usePendingRename() {
  const pendingRename = useSyncExternalStore(pendingRenameStore.subscribe, pendingRenameStore.getSnapshot)
  return { pendingRename, setPendingRename: pendingRenameStore.setState }
}

const versionHistoryNoteStore = createStore<Note | null>(null)

/** Cross-page "open version history sheet for a note" signal, shared without a context provider. */
export function useVersionHistorySheet() {
  const versionHistoryNote = useSyncExternalStore(
    versionHistoryNoteStore.subscribe,
    versionHistoryNoteStore.getSnapshot
  )

  const openVersionHistory = useCallback((note: Note) => versionHistoryNoteStore.setState(note), [])
  const closeVersionHistory = useCallback(() => versionHistoryNoteStore.setState(null), [])

  return { versionHistoryNote, openVersionHistory, closeVersionHistory }
}
