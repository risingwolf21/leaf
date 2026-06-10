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

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
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
      .order('updated_at', { ascending: false })

    if (!error && data) setNotes(data as Note[])
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchNotes().then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, fetchNotes])

  // Clear any pending debounce timers on unmount.
  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const createNote = useCallback(async (): Promise<Note | null> => {
    if (!user) return null

    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title: 'Untitled', content: '' })
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

    setNotes((prev) => prev.filter((note) => note.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }, [])

  return { notes, loading, createNote, updateNote, deleteNote, savingIds, refetch: fetchNotes }
}
