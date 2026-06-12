import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function storageKey(userId: string) {
  return `leaf-collapsed-folders-${userId}`
}

/** Persists the sidebar file tree's collapsed-folder ids to localStorage, scoped per user. */
export function useCollapsedFolders() {
  const { user } = useAuth()
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setCollapsedIds(new Set())
      return
    }

    const stored = localStorage.getItem(storageKey(user.id))
    if (!stored) return

    try {
      const ids = JSON.parse(stored) as string[]
      setCollapsedIds(new Set(ids))
    } catch {
      setCollapsedIds(new Set())
    }
  }, [user])

  const toggleFolderCollapsed = useCallback(
    (id: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        if (user) localStorage.setItem(storageKey(user.id), JSON.stringify([...next]))
        return next
      })
    },
    [user]
  )

  return { collapsedFolderIds: collapsedIds, toggleFolderCollapsed }
}
