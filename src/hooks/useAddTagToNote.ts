import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSetNoteTags } from '@/hooks/useSetNoteTags'
import { notesKeys, tagsKeys } from '@/lib/queryKeys'
import type { NoteWithTags, Tag } from '@/types'

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
