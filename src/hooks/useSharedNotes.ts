import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { NoteFields } from '@/hooks/useNotes'
import type { SharedNote } from '@/types'
import { toast } from 'sonner'

const AUTOSAVE_DELAY = 1000
const LAST_SEEN_KEY_PREFIX = 'leaf:shared-notes-last-seen:'

/** Notes shared with the current user by other owners, for the "Shared with me" sidebar section. */
export function useSharedNotes() {
  const { user } = useAuth()
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const fetchSharedNotes = useCallback(async () => {
    if (!user) {
      setSharedNotes([])
      return
    }

    const { data, error } = await supabase.rpc('get_shared_notes')
    if (!error && data) setSharedNotes(data as SharedNote[])
  }, [user])

  useEffect(() => {
    if (!user) {
      setSharedNotes([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchSharedNotes().then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, fetchSharedNotes])

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  // Once per session, notify the user about any notes shared with them
  // since their last visit.
  const notifiedRef = useRef(false)
  useEffect(() => {
    if (!user || loading || notifiedRef.current) return
    notifiedRef.current = true

    const key = `${LAST_SEEN_KEY_PREFIX}${user.id}`
    const lastSeenAt = localStorage.getItem(key)
    const lastSeenTime = lastSeenAt ? new Date(lastSeenAt).getTime() : 0

    const unseen = sharedNotes.filter(
      (note) => new Date(note.shared_since).getTime() > lastSeenTime
    )

    if (unseen.length > 0) {
      const mostRecent = unseen.reduce((latest, note) =>
        new Date(note.shared_since) > new Date(latest.shared_since) ? note : latest
      )
      toast(`${mostRecent.owner_email} shared a note with you.`)
    }

    localStorage.setItem(key, new Date().toISOString())
  }, [user, loading, sharedNotes])

  /** Same debounced-autosave shape as `useNotes().updateNote`, for editor-role collaborators. */
  const updateSharedNote = useCallback((id: string, fields: NoteFields) => {
    setSharedNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...fields } : note))
    )

    setSavingIds((prev) => new Set(prev).add(id))

    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      timers.current.delete(id)

      // RLS's "Editors can update shared notes" policy enforces that only
      // editor-role collaborators can write here.
      await supabase.from('notes').update(fields).eq('id', id)

      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, AUTOSAVE_DELAY)

    timers.current.set(id, timer)
  }, [])

  const removeSelfFromNote = useCallback(async (noteId: string) => {
    setSharedNotes((prev) => prev.filter((note) => note.id !== noteId))
    await supabase.from('note_collaborators').delete().eq('note_id', noteId)
  }, [])

  return {
    sharedNotes,
    loading,
    savingIds,
    updateSharedNote,
    removeSelfFromNote,
    refetch: fetchSharedNotes,
  }
}
