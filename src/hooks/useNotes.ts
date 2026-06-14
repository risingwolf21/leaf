import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { sortNotes } from '@/lib/notes'
import type { NoteWithTags } from '@/types'

export function useNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notesKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notes_with_tags')
      if (error) throw error
      return sortNotes((data ?? []) as NoteWithTags[], 'updated_at')
    },
    enabled: !!user,
  })
}
