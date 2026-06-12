import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Note, Tag } from '@/types'

interface NoteTagRow {
  notes: Note | null
}

export function useTags() {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([])
      return
    }

    const { data, error } = await supabase.rpc('get_tags_with_counts')
    if (!error && data) setTags(data as Tag[])
  }, [user])

  useEffect(() => {
    if (!user) {
      setTags([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchTags().then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, fetchTags])

  const updateTagColor = useCallback(async (id: string, color: string) => {
    setTags((prev) => prev.map((tag) => (tag.id === id ? { ...tag, color } : tag)))
    await supabase.from('tags').update({ color }).eq('id', id)
  }, [])

  const deleteTag = useCallback(async (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id))
    await supabase.from('tags').delete().eq('id', id)
  }, [])

  const getNotesForTag = useCallback(async (tagId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('note_tags')
      .select('notes(*)')
      .eq('tag_id', tagId)

    if (error || !data) return []

    return (data as unknown as NoteTagRow[])
      .map((row) => row.notes)
      .filter((note): note is Note => note !== null && note.deleted_at === null)
  }, [])

  /** Finds an existing tag by (case-insensitive) name, or creates one with the default colour. */
  const addTagToNote = useCallback(
    async (noteId: string, tagName: string): Promise<Tag | null> => {
      if (!user) return null

      const name = tagName.trim().toLowerCase().slice(0, 50)
      if (!name) return null

      let tag = tags.find((t) => t.name === name) ?? null

      if (!tag) {
        const { data, error } = await supabase
          .from('tags')
          .insert({ user_id: user.id, name })
          .select()
          .single()

        if (error || !data) return null

        tag = { ...(data as Tag), note_count: 0 }
        const created = tag
        setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }

      const { data: linkRows, error: linkError } = await supabase
        .from('note_tags')
        .upsert(
          { note_id: noteId, tag_id: tag.id },
          { onConflict: 'note_id,tag_id', ignoreDuplicates: true }
        )
        .select()

      if (linkError) return null

      if (linkRows && linkRows.length > 0) {
        const tagId = tag.id
        setTags((prev) =>
          prev.map((t) => (t.id === tagId ? { ...t, note_count: (t.note_count ?? 0) + 1 } : t))
        )
      }

      return tag
    },
    [user, tags]
  )

  const removeTagFromNote = useCallback(async (noteId: string, tagId: string) => {
    await supabase.from('note_tags').delete().eq('note_id', noteId).eq('tag_id', tagId)

    setTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, note_count: Math.max(0, (t.note_count ?? 0) - 1) } : t))
    )
  }, [])

  return {
    tags,
    loading,
    updateTagColor,
    deleteTag,
    getNotesForTag,
    addTagToNote,
    removeTagFromNote,
    refetch: fetchTags,
  }
}
