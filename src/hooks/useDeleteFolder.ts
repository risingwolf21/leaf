import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys, notesKeys } from '@/lib/queryKeys'
import type { Folder, NoteWithTags } from '@/types'

export function useDeleteFolder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('folders').delete().eq('id', id)
    },
    onMutate: (id) => {
      const folders = queryClient.getQueryData<Folder[]>(foldersKeys.all(user?.id)) ?? []

      // Deleting a folder cascades to its subfolders in the database, and notes
      // in any of those folders are set back to Unfiled. Mirror that locally so
      // the UI doesn't keep showing now-deleted descendant folders.
      const idsToRemove = new Set<string>()
      const collect = (folderId: string) => {
        idsToRemove.add(folderId)
        for (const folder of folders) {
          if (folder.parent_id === folderId) collect(folder.id)
        }
      }
      collect(id)

      queryClient.setQueryData<Folder[]>(foldersKeys.all(user?.id), (prev = []) =>
        prev.filter((folder) => !idsToRemove.has(folder.id))
      )

      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) =>
          note.folder_id && idsToRemove.has(note.folder_id) ? { ...note, folder_id: null } : note
        )
      )
    },
  })
}
