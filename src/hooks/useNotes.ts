import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Note } from '@/types'

const AUTOSAVE_DELAY = 1000

type NoteFields = Partial<Pick<Note, 'title' | 'content'>>

function sortByUpdatedAtDesc(notes: Note[]) {
  return [...notes].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

function sortByDeletedAtDesc(notes: Note[]) {
  return [...notes].sort(
    (a, b) =>
      new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime()
  )
}

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([])
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (!error && data) setNotes(data as Note[])
  }, [user])

  const fetchTrashedNotes = useCallback(async () => {
    if (!user) {
      setTrashedNotes([])
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('updated_at', { ascending: false })

    if (!error && data) setTrashedNotes(sortByDeletedAtDesc(data as Note[]))
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotes([])
      setTrashedNotes([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([fetchNotes(), fetchTrashedNotes()]).then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, fetchNotes, fetchTrashedNotes])

  // Clear any pending debounce timers on unmount.
  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const createNote = useCallback(async (folderId: string | null = null): Promise<Note | null> => {
    if (!user) return null

    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled', content: '', folder_id: folderId })
      .select()
      .single()

    if (error || !data) return null

    const note = data as Note
    setNotes((prev) => sortByUpdatedAtDesc([note, ...prev]))
    return note
  }, [user])

  const updateNote = useCallback((id: string, fields: NoteFields) => {
    // Optimistic local update so the UI feels instant.
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...fields } : note))
    )

    setSavingIds((prev) => new Set(prev).add(id))

    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      timers.current.delete(id)

      const { data, error } = await supabase
        .from('notes')
        .update(fields)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const updated = data as Note
        setNotes((prev) =>
          sortByUpdatedAtDesc(prev.map((note) => (note.id === id ? updated : note)))
        )
      }

      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, AUTOSAVE_DELAY)

    timers.current.set(id, timer)
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    const existing = timers.current.get(id)
    if (existing) {
      clearTimeout(existing)
      timers.current.delete(id)
    }

    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    const deletedAt = new Date().toISOString()

    setNotes((prev) => {
      const note = prev.find((n) => n.id === id)
      if (note) {
        const trashed = { ...note, deleted_at: deletedAt, updated_at: deletedAt }
        setTrashedNotes((prevTrashed) => sortByDeletedAtDesc([trashed, ...prevTrashed]))
      }
      return prev.filter((n) => n.id !== id)
    })

    await supabase.from('notes').update({ deleted_at: deletedAt }).eq('id', id)
  }, [])

  const restoreNote = useCallback(async (id: string) => {
    setTrashedNotes((prev) => {
      const note = prev.find((n) => n.id === id)
      if (note) {
        const restored = { ...note, deleted_at: null }
        setNotes((prevNotes) => sortByUpdatedAtDesc([restored, ...prevNotes]))
      }
      return prev.filter((n) => n.id !== id)
    })

    await supabase.from('notes').update({ deleted_at: null }).eq('id', id)
  }, [])

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    setTrashedNotes((prev) => prev.filter((note) => note.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }, [])

  const emptyTrash = useCallback(async () => {
    if (!user) return
    setTrashedNotes([])
    await supabase.from('notes').delete().eq('user_id', user.id).not('deleted_at', 'is', null)
  }, [user])

  return {
    notes,
    trashedNotes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    savingIds,
    refetch: fetchNotes,
  }
}
