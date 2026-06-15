import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { Note } from '@/types'

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
