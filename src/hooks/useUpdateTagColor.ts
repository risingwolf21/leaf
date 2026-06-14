import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { tagsKeys } from '@/lib/queryKeys'
import type { Tag } from '@/types'

export function useUpdateTagColor() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      await supabase.from('tags').update({ color }).eq('id', id)
    },
    onMutate: ({ id, color }) => {
      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) =>
        prev.map((tag) => (tag.id === id ? { ...tag, color } : tag))
      )
    },
  })
}
