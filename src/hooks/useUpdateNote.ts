import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { mergeTags, syncContentTags } from '@/lib/tags'
import type { Note, NoteFields, NoteWithTags, Tag } from '@/types'

const AUTOSAVE_DELAY = 1000

/**
 * Debounced autosave for note edits. `updateNote(id, fields)` applies an
 * optimistic update to the cache immediately, then debounces (1s) the
 * Supabase write, version snapshot, and `#hashtag` sync per note id.
 *
 * @param onTagsSynced Called (fire-and-forget) whenever a debounced content
 * save syncs new `#hashtag`s to the `tags` table, so the global tag list
 * (e.g. note counts) can be refreshed.
 */
export function useUpdateNote(onTagsSynced?: () => void) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Clear any pending debounce timers on unmount.
  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: NoteFields }) => {
      const { data, error } = await supabase.from('notes').update(fields).eq('id', id).select().single()
      if (error || !data) throw error ?? new Error('Failed to update note')

      const updated = data as Note

      await supabase.rpc('save_note_version', {
        p_note_id: id,
        p_title: updated.title,
        p_content: updated.content,
      })

      let syncedTags: Tag[] = []
      if ('content' in fields && user) {
        syncedTags = await syncContentTags(user.id, id, updated.content)
      }

      return { updated, syncedTags }
    },
    onSuccess: ({ updated, syncedTags }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) =>
          note.id === updated.id
            ? { ...updated, tags: syncedTags.length > 0 ? mergeTags(note.tags, syncedTags) : note.tags }
            : note
        )
      )
      if (syncedTags.length > 0) onTagsSynced?.()
    },
    onSettled: (_data, _error, variables) => {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(variables.id)
        return next
      })
    },
  })

  const updateNote = useCallback(
    (id: string, fields: NoteFields) => {
      // Optimistic local update so the UI feels instant.
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
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

  return { updateNote, savingIds }
}
