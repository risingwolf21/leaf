import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { tagsKeys } from '@/lib/queryKeys'
import type { Tag } from '@/types'

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
