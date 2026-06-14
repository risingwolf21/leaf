import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCreateNote } from '@/hooks/useNotes'
import { applyTemplateVariables } from '@/lib/templates'
import { templatesKeys } from '@/lib/queryKeys'
import type { AnyTemplate, Template } from '@/types'

export function useTemplates() {
  const { user } = useAuth()

  return useQuery({
    queryKey: templatesKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as Template[]
    },
    enabled: !!user,
  })
}

export function useSaveAsTemplate() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, content }: { name: string; content: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('templates')
        .insert({ user_id: user.id, name, content })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to save template')
      return data as Template
    },
    onSuccess: (template) => {
      queryClient.setQueryData<Template[]>(templatesKeys.all(user?.id), (prev = []) => [...prev, template])
    },
  })
}

export function useRenameTemplate() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await supabase.from('templates').update({ name }).eq('id', id)
    },
    onMutate: ({ id, name }) => {
      queryClient.setQueryData<Template[]>(templatesKeys.all(user?.id), (prev = []) =>
        prev.map((template) => (template.id === id ? { ...template, name } : template))
      )
    },
  })
}

export function useDeleteTemplate() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('templates').delete().eq('id', id)
    },
    onMutate: (id) => {
      queryClient.setQueryData<Template[]>(templatesKeys.all(user?.id), (prev = []) =>
        prev.filter((template) => template.id !== id)
      )
    },
  })
}

/** Composes `useCreateNote` with template-variable substitution. */
export function useCreateNoteFromTemplate() {
  const { mutate, ...rest } = useCreateNote()

  const createNoteFromTemplate = useCallback(
    (template: AnyTemplate, folderId: string | null = null, options?: Parameters<typeof mutate>[1]) => {
      const { name, content } = template.template
      mutate({ folderId, fields: { title: name, content: applyTemplateVariables(content) } }, options)
    },
    [mutate]
  )

  return { createNoteFromTemplate, ...rest }
}
