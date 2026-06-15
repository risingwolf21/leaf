import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys } from '@/lib/queryKeys'
import type { Folder } from '@/types'

export function useRenameFolder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase.from('folders').update({ name }).eq('id', id)
    },
    onMutate: ({ id, name }) => {
      queryClient.setQueryData<Folder[]>(foldersKeys.all(user?.id), (prev = []) =>
        prev.map((folder) => (folder.id === id ? { ...folder, name } : folder))
      )
    },
  })
}
