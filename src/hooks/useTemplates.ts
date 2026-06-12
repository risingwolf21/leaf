import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { applyTemplateVariables } from '@/lib/templates'
import type { NoteFields } from '@/hooks/useNotes'
import type { AnyTemplate, Note, Template } from '@/types'

type CreateNote = (folderId?: string | null, fields?: NoteFields) => Promise<Note | null>

export function useTemplates(createNote: CreateNote) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTemplates([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setTemplates(data as Template[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const saveAsTemplate = useCallback(
    async (name: string, content: string) => {
      if (!user) return

      const { data, error } = await supabase
        .from('templates')
        .insert({ user_id: user.id, name, content })
        .select()
        .single()

      if (!error && data) setTemplates((prev) => [...prev, data as Template])
    },
    [user]
  )

  const renameTemplate = useCallback(async (id: string, name: string) => {
    setTemplates((prev) =>
      prev.map((template) => (template.id === id ? { ...template, name } : template))
    )
    await supabase.from('templates').update({ name }).eq('id', id)
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
    await supabase.from('templates').delete().eq('id', id)
  }, [])

  const createNoteFromTemplate = useCallback(
    async (template: AnyTemplate, folderId: string | null = null): Promise<Note | null> => {
      const { name, content } = template.template
      return createNote(folderId, { title: name, content: applyTemplateVariables(content) })
    },
    [createNote]
  )

  return { templates, loading, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate }
}
