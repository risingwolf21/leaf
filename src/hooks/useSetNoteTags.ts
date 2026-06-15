import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { NoteWithTags, Tag } from '@/types'

/** Updates a note's `tags` array in the React Query cache; used by tag-assignment mutations. */
export function useSetNoteTags() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useCallback(
    (id: string, tags: Tag[]) => {
      queryClient.setQueryData<NoteWithTags[]>(notesKeys.all(user?.id), (prev = []) =>
        prev.map((note) => (note.id === id ? { ...note, tags } : note))
      )
    },
    [queryClient, user]
  )
}
