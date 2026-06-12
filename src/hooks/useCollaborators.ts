import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { NoteCollaborator, ShareRole } from '@/types'

/** Manages the list of people a single note is shared with. */
export function useCollaborators(noteId: string | null) {
  const { user } = useAuth()
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCollaborators = useCallback(async () => {
    if (!noteId) {
      setCollaborators([])
      return
    }

    const { data, error } = await supabase.rpc('get_note_collaborators', { p_note_id: noteId })
    if (!error && data) setCollaborators(data as NoteCollaborator[])
  }, [noteId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchCollaborators().then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [fetchCollaborators])

  const addCollaborator = useCallback(
    async (email: string, role: ShareRole) => {
      if (!noteId || !user) return

      const normalizedEmail = email.trim().toLowerCase()

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (!profile) throw new Error('No Leaf account found for this email address.')
      if (profile.id === user.id) throw new Error('You cannot share a note with yourself.')
      if (collaborators.some((collaborator) => collaborator.user_id === profile.id)) {
        throw new Error('This person already has access.')
      }

      const { data, error } = await supabase
        .from('note_collaborators')
        .insert({ note_id: noteId, owner_id: user.id, user_id: profile.id, role })
        .select()
        .single()

      if (error || !data) throw new Error('Could not share this note. Please try again.')

      const row = data as Omit<NoteCollaborator, 'email'>
      setCollaborators((prev) => [...prev, { ...row, email: profile.email }])
    },
    [noteId, user, collaborators]
  )

  const updateCollaboratorRole = useCallback(async (collaboratorId: string, role: ShareRole) => {
    setCollaborators((prev) =>
      prev.map((collaborator) =>
        collaborator.id === collaboratorId ? { ...collaborator, role } : collaborator
      )
    )

    await supabase.from('note_collaborators').update({ role }).eq('id', collaboratorId)
  }, [])

  const removeCollaborator = useCallback(async (collaboratorId: string) => {
    setCollaborators((prev) => prev.filter((collaborator) => collaborator.id !== collaboratorId))
    await supabase.from('note_collaborators').delete().eq('id', collaboratorId)
  }, [])

  return {
    collaborators,
    loading,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
  }
}
