import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { NoteWithTags } from '@/types'

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
