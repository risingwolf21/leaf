import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys, notesKeys } from '@/lib/queryKeys'
import type { Folder, NoteWithTags } from '@/types'

export function useFolders() {
  const { user } = useAuth()

  return useQuery({
    queryKey: foldersKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as Folder[]
    },
    enabled: !!user,
  })
}

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

export function useMoveNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, folderId }: { noteId: string; folderId: string | null }) => {
      await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
    },
    onMutate: ({ noteId, folderId }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === noteId ? { ...note, folder_id: folderId } : note))
      )
    },
  })
}

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

/** Returns `folderId` plus every ancestor up to the root (via `parent_id`), or `[]` if `folderId` is null. */
export function getFolderAncestorChain(folderId: string | null, folders: Folder[]): string[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const chain: string[] = []

  let current = folderId
  while (current) {
    chain.push(current)
    current = byId.get(current)?.parent_id ?? null
  }

  return chain
}
