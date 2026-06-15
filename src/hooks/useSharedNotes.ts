import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { sharedNotesKeys } from '@/lib/queryKeys'
import type { SharedNote } from '@/types'

const LAST_SEEN_KEY_PREFIX = 'leaf:shared-notes-last-seen:'

/** Notes shared with the current user by other owners, for the "Shared with me" sidebar section. */
export function useSharedNotes() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: sharedNotesKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_notes')
      if (error) throw error
      // Supabase client has no generated Database types, so query/RPC results are `any`.
      return (data ?? []) as SharedNote[]
    },
    enabled: !!user,
  })

  // Once per session, notify the user about any notes shared with them
  // since their last visit.
  const notifiedRef = useRef(false)
  useEffect(() => {
    if (!user || query.isLoading || !query.data || notifiedRef.current) return
    notifiedRef.current = true

    const key = `${LAST_SEEN_KEY_PREFIX}${user.id}`
    const lastSeenAt = localStorage.getItem(key)
    const lastSeenTime = lastSeenAt ? new Date(lastSeenAt).getTime() : 0

    const unseen = query.data.filter((note) => new Date(note.shared_since).getTime() > lastSeenTime)

    if (unseen.length > 0) {
      const mostRecent = unseen.reduce((latest, note) =>
        new Date(note.shared_since) > new Date(latest.shared_since) ? note : latest
      )
      toast(`${mostRecent.owner_email} shared a note with you.`)
    }

    localStorage.setItem(key, new Date().toISOString())
  }, [user, query.isLoading, query.data])

  return query
}
