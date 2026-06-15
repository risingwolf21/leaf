import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys } from '@/lib/queryKeys'
import type { Folder } from '@/types'

export function useMoveFolder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ folderId, newParentId }: { folderId: string; newParentId: string | null }) => {
      if (folderId === newParentId) return null

      // Prevent nesting a folder inside itself or one of its own descendants.
      const folders = queryClient.getQueryData<Folder[]>(foldersKeys.all(user?.id)) ?? []
      if (newParentId) {
        const isDescendant = (id: string): boolean => {
          const folder = folders.find((item) => item.id === id)
          if (!folder || !folder.parent_id) return false
          if (folder.parent_id === folderId) return true
          return isDescendant(folder.parent_id)
        }
        if (isDescendant(newParentId)) return null
      }

      await supabase.from('folders').update({ parent_id: newParentId }).eq('id', folderId)
      return { folderId, newParentId }
    },
    onSuccess: (result) => {
      if (!result) return
      const { folderId, newParentId } = result
      queryClient.setQueryData<Folder[]>(foldersKeys.all(user?.id), (prev = []) =>
        prev.map((folder) => (folder.id === folderId ? { ...folder, parent_id: newParentId } : folder))
      )
    },
  })
}
