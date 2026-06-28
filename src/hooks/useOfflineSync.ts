import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useConflicts } from '@/lib/conflictStore'
import { getAllPending } from '@/lib/outbox'
import { replayOutbox } from '@/lib/outboxReplay'

export function useOfflineSync() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { addConflict } = useConflicts()
  const [pendingCount, setPendingCount] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)

  // Keep pending count in sync with the outbox.
  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      const pending = await getAllPending()
      if (!cancelled) setPendingCount(pending.length)
    }

    refresh()

    // Re-check whenever we come back online or the window regains focus.
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const handleOnline = async () => {
      setIsReplaying(true)
      try {
        await replayOutbox(user.id, queryClient, addConflict)
      } finally {
        setIsReplaying(false)
        // Refresh count after replay empties the outbox.
        const remaining = await getAllPending()
        setPendingCount(remaining.length)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user, queryClient, addConflict])

  return { pendingCount, isReplaying }
}
