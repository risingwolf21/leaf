import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { enqueue } from '@/lib/outbox'
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
      const now = new Date().toISOString()

      if (!navigator.onLine) {
        // Use a temporary id until the note is synced to the server.
        const tempId = `temp-${crypto.randomUUID()}`
        await enqueue({
          type: 'create',
          note: {
            user_id: user.id,
            title,
            content,
            folder_id: folderId ?? null,
            pinned: false,
            deleted_at: null,
            share_token: null,
            shared_at: null,
            share_link_role: 'viewer',
            ydoc_state: null,
          },
          tempId,
          queuedAt: now,
        })
        return {
          id: tempId,
          user_id: user.id,
          title,
          content,
          folder_id: folderId ?? null,
          pinned: false,
          deleted_at: null,
          created_at: now,
          updated_at: now,
          share_token: null,
          shared_at: null,
          share_link_role: 'viewer',
          ydoc_state: null,
          tags: [],
        }
      }

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
