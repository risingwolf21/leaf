import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { mergeTags, syncContentTags } from '@/lib/tags'
import type { NoteFields, NoteWithTags, Tag } from '@/types'

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
    mutationFn: async ({
      id,
      fields,
      title,
      content,
    }: { id: string; fields: NoteFields; title: string; content: string }) => {
      const { error } = await supabase.from('notes').update(fields).eq('id', id)
      if (error) throw error

      // A trigger encrypts title/content at rest, so the version snapshot and
      // hashtag scan use the plaintext we already have rather than reading
      // ciphertext back from the database.
      await supabase.rpc('save_note_version', { p_note_id: id, p_title: title, p_content: content })

      let syncedTags: Tag[] = []
      if ('content' in fields && user) {
        syncedTags = await syncContentTags(user.id, id, content)
      }

      return { id, syncedTags }
    },
    onSuccess: ({ id, syncedTags }) => {
      if (syncedTags.length === 0) return
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, tags: mergeTags(note.tags, syncedTags) } : note))
      )
      onTagsSynced?.()
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
      let title = ''
      let content = ''

      // Optimistic local update so the UI feels instant; also capture the
      // resulting plaintext title/content for the debounced save below.
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => {
          if (note.id !== id) return note
          const next: NoteWithTags = { ...note, ...fields }
          title = next.title
          content = next.content
          return next
        })
      )

      setSavingIds((prev) => new Set(prev).add(id))

      const existing = timers.current.get(id)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(() => {
        timers.current.delete(id)
        mutation.mutate({ id, fields, title, content })
      }, AUTOSAVE_DELAY)

      timers.current.set(id, timer)
    },
    [queryClient, user, mutation]
  )

  return { updateNote, savingIds }
}
