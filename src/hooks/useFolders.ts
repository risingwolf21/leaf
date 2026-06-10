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
    async (name: string): Promise<Folder | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('folders')
        .insert({ user_id: user.id, name })
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

  const deleteFolder = useCallback(async (id: string) => {
    await supabase.from('notes').update({ folder_id: null }).eq('folder_id', id)
    setFolders((prev) => prev.filter((folder) => folder.id !== id))
    await supabase.from('folders').delete().eq('id', id)
  }, [])

  const moveNote = useCallback(async (noteId: string, folderId: string | null) => {
    await supabase.from('notes').update({ folder_id: folderId }).eq('id', noteId)
  }, [])

  return { folders, loading, createFolder, renameFolder, deleteFolder, moveNote }
}
