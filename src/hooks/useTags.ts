import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSetNoteTags } from '@/hooks/useNotes'
import { notesKeys, tagsKeys } from '@/lib/queryKeys'
import type { NoteWithTags, Tag } from '@/types'

export function useTags() {
  const { user } = useAuth()

  return useQuery({
    queryKey: tagsKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tags_with_counts')
      if (error) throw error
      return (data ?? []) as Tag[]
    },
    enabled: !!user,
  })
}

export function useUpdateTagColor() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      await supabase.from('tags').update({ color }).eq('id', id)
    },
    onMutate: ({ id, color }) => {
      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) =>
        prev.map((tag) => (tag.id === id ? { ...tag, color } : tag))
      )
    },
  })
}

export function useDeleteTag() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('tags').delete().eq('id', id)
    },
    onMutate: (id) => {
      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) => prev.filter((tag) => tag.id !== id))
    },
  })
}

export function useRenameTag() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim().toLowerCase().slice(0, 50)
      if (!trimmed) return
      await supabase.from('tags').update({ name: trimmed }).eq('id', id)
    },
    onMutate: ({ id, name }) => {
      const trimmed = name.trim().toLowerCase().slice(0, 50)
      if (!trimmed) return

      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) =>
        prev
          .map((tag) => (tag.id === id ? { ...tag, name: trimmed } : tag))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    },
  })
}

/** Finds an existing tag by (case-insensitive) name, or creates one with the default colour, then links it to the note. */
export function useAddTagToNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const setNoteTags = useSetNoteTags()

  return useMutation({
    mutationFn: async ({ noteId, tagName }: { noteId: string; tagName: string }): Promise<Tag | null> => {
      if (!user) return null

      const name = tagName.trim().toLowerCase().slice(0, 50)
      if (!name) return null

      const tags = queryClient.getQueryData<Tag[]>(tagsKeys.all(user.id)) ?? []
      let tag = tags.find((t) => t.name === name) ?? null

      if (!tag) {
        const { data, error } = await supabase.from('tags').insert({ user_id: user.id, name }).select().single()

        if (error || !data) return null

        tag = { ...(data as Tag), note_count: 0 }
        const created = tag
        queryClient.setQueryData<Tag[]>(tagsKeys.all(user.id), (prev = []) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        )
      }

      const { data: linkRows, error: linkError } = await supabase
        .from('note_tags')
        .upsert({ note_id: noteId, tag_id: tag.id }, { onConflict: 'note_id,tag_id', ignoreDuplicates: true })
        .select()

      if (linkError) return null

      if (linkRows && linkRows.length > 0) {
        const tagId = tag.id
        queryClient.setQueryData<Tag[]>(tagsKeys.all(user.id), (prev = []) =>
          prev.map((t) => (t.id === tagId ? { ...t, note_count: (t.note_count ?? 0) + 1 } : t))
        )
      }

      return tag
    },
    onSuccess: (tag, { noteId }) => {
      if (!tag) return

      const notes = queryClient.getQueryData<NoteWithTags[]>(notesKeys.all(user?.id)) ?? []
      const note = notes.find((n) => n.id === noteId)
      if (!note || note.tags.some((t) => t.id === tag.id)) return

      setNoteTags(noteId, [...note.tags, tag])
    },
  })
}

export function useRemoveTagFromNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const setNoteTags = useSetNoteTags()

  return useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      await supabase.from('note_tags').delete().eq('note_id', noteId).eq('tag_id', tagId)
    },
    onMutate: ({ noteId, tagId }) => {
      const notes = queryClient.getQueryData<NoteWithTags[]>(notesKeys.all(user?.id)) ?? []
      const note = notes.find((n) => n.id === noteId)
      if (note) setNoteTags(noteId, note.tags.filter((t) => t.id !== tagId))

      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) =>
        prev.map((t) => (t.id === tagId ? { ...t, note_count: Math.max(0, (t.note_count ?? 0) - 1) } : t))
      )
    },
  })
}
