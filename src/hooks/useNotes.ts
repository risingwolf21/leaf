import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { mergeTags, syncContentTags } from '@/lib/tags'
import type { Note, NoteWithTags, Tag } from '@/types'

const AUTOSAVE_DELAY = 1000

export type NoteFields = Partial<Pick<Note, 'title' | 'content' | 'share_link_role'>>

export type SortBy = 'updated_at' | 'created_at' | 'title_asc' | 'title_desc'

function byUpdatedAtDesc<T extends Note>(a: T, b: T) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
}

function sortByDeletedAtDesc(notes: Note[]) {
  return [...notes].sort(
    (a, b) => new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime()
  )
}

/** Pinned notes always come first (sorted by `updated_at desc`); the rest follow `sortBy`. */
export function sortNotes<T extends Note>(notes: T[], sortBy: SortBy): T[] {
  const pinned = notes.filter((note) => note.pinned).sort(byUpdatedAtDesc)
  const rest = notes.filter((note) => !note.pinned)

  switch (sortBy) {
    case 'created_at':
      rest.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'title_asc':
      rest.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title_desc':
      rest.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'updated_at':
    default:
      rest.sort(byUpdatedAtDesc)
  }

  return [...pinned, ...rest]
}

export function useNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notesKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notes_with_tags')
      if (error) throw error
      return sortNotes((data ?? []) as NoteWithTags[], 'updated_at')
    },
    enabled: !!user,
  })
}

export function useTrashedNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notesKeys.trash(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return sortByDeletedAtDesc((data ?? []) as Note[])
    },
    enabled: !!user,
  })
}

export function useCreateNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId = null,
      fields = {},
    }: { folderId?: string | null; fields?: NoteFields }): Promise<NoteWithTags> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: fields.title ?? 'Untitled',
          content: fields.content ?? '',
          folder_id: folderId,
        })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to create note')

      return { ...(data as Note), tags: [] }
    },
    onSuccess: (note) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) => [note, ...prev])
    },
  })
}

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

export function useDeleteNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    },
    onMutate: (id) => {
      const deletedAt = new Date().toISOString()
      const notes = queryClient.getQueryData<NoteWithTags[]>(notesKeys.all(user?.id)) ?? []
      const note = notes.find((n) => n.id === id)

      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.filter((n) => n.id !== id)
      )

      if (note) {
        const trashed: Note = { ...note, deleted_at: deletedAt, updated_at: deletedAt }
        queryClient.setQueryData<Note[]>(notesKeys.trash(user?.id), (prev = []) =>
          sortByDeletedAtDesc([trashed, ...prev])
        )
      }
    },
  })
}

export function useRestoreNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notes').update({ deleted_at: null }).eq('id', id)
    },
    onMutate: (id) => {
      const trashed = queryClient.getQueryData<Note[]>(notesKeys.trash(user?.id)) ?? []
      const note = trashed.find((n) => n.id === id)

      queryClient.setQueryData<Note[]>(notesKeys.trash(user?.id), (prev = []) => prev.filter((n) => n.id !== id))

      if (note) {
        const restored: NoteWithTags = { ...note, deleted_at: null, tags: [] }
        queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) => [restored, ...prev])
      }
    },
  })
}

export function usePermanentlyDeleteNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notes').delete().eq('id', id)
    },
    onMutate: (id) => {
      queryClient.setQueryData<Note[]>(notesKeys.trash(user?.id), (prev = []) => prev.filter((n) => n.id !== id))
    },
  })
}

export function useEmptyTrash() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user) return
      await supabase.from('notes').delete().eq('user_id', user.id).not('deleted_at', 'is', null)
    },
    onMutate: () => {
      queryClient.setQueryData<Note[]>(notesKeys.trash(user?.id), [])
    },
  })
}

export function useTogglePin() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      await supabase.from('notes').update({ pinned }).eq('id', id)
    },
    onMutate: ({ id, pinned }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, pinned } : note))
      )
    },
  })
}

export function useShareNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = crypto.randomUUID().replace(/-/g, '')
      const sharedAt = new Date().toISOString()

      await supabase.from('notes').update({ share_token: token, shared_at: sharedAt }).eq('id', id)

      return { id, token, sharedAt, url: `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}` }
    },
    onSuccess: ({ id, token, sharedAt }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, share_token: token, shared_at: sharedAt } : note))
      )
    },
  })
}

export function useUnshareNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notes').update({ share_token: null, shared_at: null }).eq('id', id)
    },
    onMutate: (id) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, share_token: null, shared_at: null } : note))
      )
    },
  })
}

/** Updates a note's `tags` array in the React Query cache; used by `useTags` mutations. */
export function useSetNoteTags() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useCallback(
    (id: string, tags: Tag[]) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, tags } : note))
      )
    },
    [queryClient, user]
  )
}
