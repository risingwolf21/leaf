import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { sharedNotesKeys } from '@/lib/queryKeys'
import type { SharedNote } from '@/types'

export function useRemoveSelfFromNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      await supabase.from('note_collaborators').delete().eq('note_id', noteId)
    },
    onMutate: (noteId) => {
      queryClient.setQueryData<SharedNote[]>(sharedNotesKeys.all(user?.id), (prev = []) =>
        prev.filter((note) => note.id !== noteId)
      )
    },
  })
}
