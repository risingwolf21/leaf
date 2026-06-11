import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { NoteLink } from '@/types'

interface LinkPreviewResponse {
  og_title: string | null
  og_description: string | null
  og_image: string | null
  error?: string
}

interface LinkInput {
  display_text: string
  url: string
  show_preview: boolean
}

export function useNoteLinks(noteId: string) {
  const { user } = useAuth()
  const [links, setLinks] = useState<NoteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingPreviewIds, setPendingPreviewIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user || !noteId) {
      setLinks([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('note_links')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setLinks(data as NoteLink[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [noteId, user])

  const fetchAndApplyPreview = useCallback(async (id: string, url: string) => {
    setPendingPreviewIds((prev) => new Set(prev).add(id))

    const { data, error } = await supabase.functions.invoke<LinkPreviewResponse>(
      'fetch-link-preview',
      { body: { url } }
    )

    const updates = {
      og_title: !error && data ? data.og_title ?? null : null,
      og_description: !error && data ? data.og_description ?? null : null,
      og_image: !error && data ? data.og_image ?? null : null,
      og_fetched_at: new Date().toISOString(),
    }

    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...updates } : link)))
    setPendingPreviewIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    await supabase.from('note_links').update(updates).eq('id', id)
  }, [])

  const addLink = useCallback(
    async (input: LinkInput) => {
      if (!user || !noteId) return

      const { data, error } = await supabase
        .from('note_links')
        .insert({
          note_id: noteId,
          user_id: user.id,
          display_text: input.display_text,
          url: input.url,
          show_preview: input.show_preview,
        })
        .select()
        .single()

      if (error || !data) return

      const link = data as NoteLink
      setLinks((prev) => [...prev, link])

      if (input.show_preview) {
        fetchAndApplyPreview(link.id, link.url)
      }
    },
    [user, noteId, fetchAndApplyPreview]
  )

  const updateLink = useCallback(
    async (id: string, input: LinkInput) => {
      const existing = links.find((link) => link.id === id)
      const urlChanged = !!existing && existing.url !== input.url

      const updates: Partial<NoteLink> = {
        display_text: input.display_text,
        url: input.url,
        show_preview: input.show_preview,
      }

      if (urlChanged) {
        updates.og_title = null
        updates.og_description = null
        updates.og_image = null
        updates.og_fetched_at = null
      }

      setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, ...updates } : link)))
      await supabase.from('note_links').update(updates).eq('id', id)

      if (input.show_preview && (urlChanged || !existing?.og_fetched_at)) {
        fetchAndApplyPreview(id, input.url)
      }
    },
    [links, fetchAndApplyPreview]
  )

  const deleteLink = useCallback(async (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
    await supabase.from('note_links').delete().eq('id', id)
  }, [])

  const togglePreview = useCallback(
    async (id: string, show_preview: boolean) => {
      const existing = links.find((link) => link.id === id)

      setLinks((prev) =>
        prev.map((link) => (link.id === id ? { ...link, show_preview } : link))
      )
      await supabase.from('note_links').update({ show_preview }).eq('id', id)

      if (show_preview && existing && !existing.og_fetched_at) {
        fetchAndApplyPreview(id, existing.url)
      }
    },
    [links, fetchAndApplyPreview]
  )

  const refreshPreview = useCallback(
    async (id: string, url: string) => {
      await fetchAndApplyPreview(id, url)
    },
    [fetchAndApplyPreview]
  )

  return {
    links,
    loading,
    pendingPreviewIds,
    addLink,
    updateLink,
    deleteLink,
    togglePreview,
    refreshPreview,
  }
}
