import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import type { Note } from '@/types'

export function useTrashedNotes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: notesKeys.trash(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trashed_notes')

      if (error) throw error
      // Supabase client has no generated Database types, so query/RPC results are `any`.
      return (data ?? []) as Note[]
    },
    enabled: !!user,
  })
}
