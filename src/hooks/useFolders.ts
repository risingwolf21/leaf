import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Folder } from '@/types'

export function useFolders() {
  const { user } = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setFolders([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setFolders(data as Folder[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const createFolder = useCallback(
    async (name: string, parentId: string | null = null): Promise<Folder | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name, parent_id: parentId })
        .select()
        .single()

      if (error || !data) return null

      const folder = data as Folder
      setFolders((prev) => [...prev, folder])
      return folder
    },
    [user]
  )

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((folder) => (folder.id === id ? { ...folder, name } : folder))
    )
    await supabase.from('folders').update({ name }).eq('id', id)
  }, [])

  const deleteFolder = useCallback(
    async (id: string) => {
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

      setFolders((prev) => prev.filter((folder) => !idsToRemove.has(folder.id)))
      await supabase.from('folders').delete().eq('id', id)
    },
    [folders]
  )

  const moveNote = useCallback(async (noteId: string, folderId: string | null) => {
    await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
  }, [])

  return { folders, loading, createFolder, renameFolder, deleteFolder, moveNote }
}
