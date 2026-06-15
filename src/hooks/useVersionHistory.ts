import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { NoteFields, NoteVersion } from '@/types'

export function useVersionHistory(
  noteId: string | null,
  updateNote: (id: string, fields: NoteFields) => void
) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVersions = useCallback(async (id: string) => {
    setLoading(true)

    const { data, error } = await supabase.rpc('get_note_versions', { p_note_id: id })

    // Supabase client has no generated Database types, so query/RPC results are `any`.
    setVersions(!error && data ? (data as NoteVersion[]) : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (noteId) {
      fetchVersions(noteId)
    } else {
      setVersions([])
    }
  }, [noteId, fetchVersions])

  const restoreVersion = useCallback(
    (version: NoteVersion) => {
      updateNote(version.note_id, { title: version.title, content: version.content })
    },
    [updateNote]
  )

  return { versions, loading, fetchVersions, restoreVersion }
}
