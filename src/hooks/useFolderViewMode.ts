import { useState } from 'react'

export type FolderViewMode = 'grid' | 'list'

const STORAGE_KEY = 'leaf:folder-view-mode'

function readStoredViewMode(): FolderViewMode {
  return localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'grid'
}

/** Persists the user's folder browser grid/list view preference across sessions. */
export function useFolderViewMode() {
  const [viewMode, setViewModeState] = useState<FolderViewMode>(readStoredViewMode)

  const setViewMode = (mode: FolderViewMode) => {
    setViewModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return { viewMode, setViewMode }
}
