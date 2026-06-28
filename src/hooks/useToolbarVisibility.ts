import { useState } from 'react'

const STORAGE_KEY = 'leaf:toolbar-visible'

function readStoredVisibility(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

/** Persists the user's editor toolbar show/hide preference across sessions. */
export function useToolbarVisibility() {
  const [isToolbarVisible, setIsToolbarVisible] = useState(readStoredVisibility)

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => {
      const next = !current
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return { isToolbarVisible, toggleToolbar }
}
