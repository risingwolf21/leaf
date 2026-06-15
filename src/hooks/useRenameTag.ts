import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { tagsKeys } from '@/lib/queryKeys'
import type { Tag } from '@/types'

export function useRenameTag() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim().toLowerCase().slice(0, 50)
      if (!trimmed) return
      await supabase.from('tags').update({ name: trimmed }).eq('id', id)
    },
    onMutate: ({ id, name }) => {
      const trimmed = name.trim().toLowerCase().slice(0, 50)
      if (!trimmed) return

      queryClient.setQueryData<Tag[]>(tagsKeys.all(user?.id), (prev = []) =>
        prev
          .map((tag) => (tag.id === id ? { ...tag, name: trimmed } : tag))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    },
  })
}
