import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { Note, NoteWithTags } from '@/types'

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
