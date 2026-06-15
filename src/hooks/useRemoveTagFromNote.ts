import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSetNoteTags } from '@/hooks/useSetNoteTags'
import { notesKeys, tagsKeys } from '@/lib/queryKeys'
import type { NoteWithTags, Tag } from '@/types'

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
