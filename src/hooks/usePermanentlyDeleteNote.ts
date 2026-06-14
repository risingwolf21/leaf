import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { Note } from '@/types'

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
