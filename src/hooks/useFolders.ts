import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { foldersKeys } from '@/lib/queryKeys'
import type { Folder } from '@/types'

export function useFolders() {
  const { user } = useAuth()

  return useQuery({
    queryKey: foldersKeys.all(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      // Supabase client has no generated Database types, so query/RPC results are `any`.
      return (data ?? []) as Folder[]
    },
    enabled: !!user,
  })
}
