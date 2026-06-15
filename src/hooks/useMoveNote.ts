import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { NoteWithTags } from '@/types'

export function useMoveNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, folderId }: { noteId: string; folderId: string | null }) => {
      await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
    },
    onMutate: ({ noteId, folderId }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === noteId ? { ...note, folder_id: folderId } : note))
      )
    },
  })
}
