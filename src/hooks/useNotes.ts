import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Note } from '@/types'

const AUTOSAVE_DELAY = 1000

export type NoteFields = Partial<Pick<Note, 'title' | 'content'>>

export type SortBy = 'updated_at' | 'created_at' | 'title_asc' | 'title_desc'

function byUpdatedAtDesc(a: Note, b: Note) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
}

function sortByDeletedAtDesc(notes: Note[]) {
  return [...notes].sort(
    (a, b) =>
      new Date(b.deleted_at ?? 0).getTime() - new Date(a.deleted_at ?? 0).getTime()
  )
}

/** Pinned notes always come first (sorted by `updated_at desc`); the rest follow `sortBy`. */
function sortNotes(notes: Note[], sortBy: SortBy) {
  const pinned = notes.filter((note) => note.pinned).sort(byUpdatedAtDesc)
  const rest = notes.filter((note) => !note.pinned)

  switch (sortBy) {
    case 'created_at':
      rest.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    case 'title_asc':
      rest.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title_desc':
      rest.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'updated_at':
    default:
      rest.sort(byUpdatedAtDesc)
  }

  return [...pinned, ...rest]
}

export function useNotes(sortBy: SortBy = 'updated_at') {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const sortByRef = useRef(sortBy)

  // Re-sort the already-loaded notes whenever the sort preference changes,
  // without refetching from Supabase.
  useEffect(() => {
    sortByRef.current = sortBy
    setNotes((prev) => sortNotes(prev, sortBy))
  }, [sortBy])

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([])
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .is('deleted_at', null)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (!error && data) setNotes(sortNotes(data as Note[], sortByRef.current))
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
    setNotes((prev) => sortNotes([note, ...prev], sortByRef.current))
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
          sortNotes(prev.map((note) => (note.id === id ? updated : note)), sortByRef.current)
        )

        await supabase.rpc('save_note_version', {
          p_note_id: id,
          p_title: updated.title,
          p_content: updated.content,
        })
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
        setNotes((prevNotes) => sortNotes([restored, ...prevNotes], sortByRef.current))
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

  const togglePin = useCallback(async (id: string, pinned: boolean) => {
    setNotes((prev) =>
      sortNotes(
        prev.map((note) => (note.id === id ? { ...note, pinned } : note)),
        sortByRef.current
      )
    )

    await supabase.from('notes').update({ pinned }).eq('id', id)
  }, [])

  const shareNote = useCallback(async (id: string): Promise<string> => {
    const token = crypto.randomUUID().replace(/-/g, '')
    const sharedAt = new Date().toISOString()

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, share_token: token, shared_at: sharedAt } : note
      )
    )

    await supabase.from('notes').update({ share_token: token, shared_at: sharedAt }).eq('id', id)

    return `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}`
  }, [])

  const unshareNote = useCallback(async (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, share_token: null, shared_at: null } : note
      )
    )

    await supabase.from('notes').update({ share_token: null, shared_at: null }).eq('id', id)
  }, [])

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
    togglePin,
    shareNote,
    unshareNote,
    savingIds,
    refetch: fetchNotes,
  }
}
