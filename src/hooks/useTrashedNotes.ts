import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { sortByDeletedAtDesc } from '@/lib/notes'
import type { Note } from '@/types'

export function useTrashedNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notesKeys.trash(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return sortByDeletedAtDesc((data ?? []) as Note[])
    },
    enabled: !!user,
  })
}
