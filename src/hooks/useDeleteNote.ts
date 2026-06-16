import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { sortByDeletedAtDesc } from '@/lib/notes'
import { enqueue } from '@/lib/outbox'
import type { Note, NoteWithTags } from '@/types'

export function useDeleteNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        // Queue the soft-delete; the optimistic update below already hides the note.
        await enqueue({ type: 'delete', noteId: id, queuedAt: new Date().toISOString() })
        return
      }
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
