import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { Note, NoteFields, NoteWithTags } from '@/types'

export function useCreateNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      folderId = null,
      fields = {},
    }: { folderId?: string | null; fields?: NoteFields }): Promise<NoteWithTags> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: fields.title ?? 'Untitled',
          content: fields.content ?? '',
          folder_id: folderId,
        })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to create note')

      return { ...(data as Note), tags: [] }
    },
    onSuccess: (note) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) => [note, ...prev])
    },
  })
}
