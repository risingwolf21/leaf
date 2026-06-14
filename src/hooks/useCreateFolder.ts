import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys } from '@/lib/queryKeys'
import type { Folder } from '@/types'

export function useCreateFolder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, parentId = null }: { name: string; parentId?: string | null }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name, parent_id: parentId })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to create folder')
      return data as Folder
    },
    onSuccess: (folder) => {
      queryClient.setQueryData<Folder[]>(foldersKeys.all(user?.id), (prev = []) => [...prev, folder])
    },
  })
}
