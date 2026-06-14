import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { tagsKeys } from '@/lib/queryKeys'
import type { Tag } from '@/types'

export function useTags() {
  const { user } = useAuth()

  return useQuery({
    queryKey: tagsKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tags_with_counts')
      if (error) throw error
      return (data ?? []) as Tag[]
    },
    enabled: !!user,
  })
}
