import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { NoteWithTags } from '@/types'

export function useShareNote() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = crypto.randomUUID().replace(/-/g, '')
      const sharedAt = new Date().toISOString()

      await supabase.from('notes').update({ share_token: token, shared_at: sharedAt }).eq('id', id)

      return { id, token, sharedAt, url: `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}` }
    },
    onSuccess: ({ id, token, sharedAt }) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, share_token: token, shared_at: sharedAt } : note))
      )
    },
  })
}
