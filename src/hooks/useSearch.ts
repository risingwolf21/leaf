import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Note } from '@/types'

const SEARCH_DEBOUNCE = 300
export const MIN_QUERY_LENGTH = 2

export function useSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (!user || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_notes', { search_term: trimmed })
      if (cancelled) return
      setResults(!error && data ? (data as Note[]) : [])
      setIsSearching(false)
    }, SEARCH_DEBOUNCE)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, user])

  return { query, setQuery, results, isSearching }
}
