import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { NoteFields } from '@/hooks/useNotes'
import { sharedNotesKeys } from '@/lib/queryKeys'
import type { SharedNote } from '@/types'

const AUTOSAVE_DELAY = 1000
const LAST_SEEN_KEY_PREFIX = 'leaf:shared-notes-last-seen:'

/** Notes shared with the current user by other owners, for the "Shared with me" sidebar section. */
export function useSharedNotes() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: sharedNotesKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shared_notes')
      if (error) throw error
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

/** Same debounced-autosave shape as `useUpdateNote`, for editor-role collaborators. */
export function useUpdateSharedNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: NoteFields }) => {
      // RLS's "Editors can update shared notes" policy enforces that only
      // editor-role collaborators can write here.
      await supabase.from('notes').update(fields).eq('id', id)
    },
    onSettled: (_data, _error, variables) => {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const updateSharedNote = useCallback(
    (id: string, fields: NoteFields) => {
      queryClient.setQueryData<SharedNote[]>(sharedNotesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, ...fields } : note))
      )

      setSavingIds((prev) => new Set(prev).add(id))

      const existing = timers.current.get(id)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(() => {
        timers.current.delete(id)
        mutation.mutate({ id, fields })
      }, AUTOSAVE_DELAY)

      timers.current.set(id, timer)
    },
    [queryClient, user, mutation]
  )

  return { updateSharedNote, savingIds }
}

export function useRemoveSelfFromNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      await supabase.from('note_collaborators').delete().eq('note_id', noteId)
    },
    onMutate: (noteId) => {
      queryClient.setQueryData<SharedNote[]>(sharedNotesKeys.all(user?.id), (prev = []) =>
        prev.filter((note) => note.id !== noteId)
      )
    },
  })
}
