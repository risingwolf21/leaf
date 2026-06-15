import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { sharedNotesKeys } from '@/lib/queryKeys'
import type { NoteFields, SharedNote } from '@/types'

const AUTOSAVE_DELAY = 1000

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
