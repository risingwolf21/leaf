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

      const title = fields.title ?? 'Untitled'
      const content = fields.content ?? ''

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title,
          content,
          folder_id: folderId,
        })
        .select()
        .single()

      if (error || !data) throw error ?? new Error('Failed to create note')

      // Supabase client has no generated Database types, so query/RPC results are `any`.
      // A trigger encrypts title/content at rest, so `data.title`/`data.content`
      // come back as ciphertext — use the plaintext we just sent instead.
      return { ...(data as Note), title, content, tags: [] }
    },
    onSuccess: (note) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) => [note, ...prev])
    },
  })
}
