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

    const { data, error } = await supabase
      .from('note_versions')
      .select('*')
      .eq('note_id', id)
      .order('saved_at', { ascending: false })

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
