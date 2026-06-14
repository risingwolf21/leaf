import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { useFolders } from '@/hooks/useFolders'
import { MIN_QUERY_LENGTH, useSearch } from '@/hooks/useSearch'
import { useSidebarMode } from '@/lib/sidebarStore'
import { onActivateKey } from '@/lib/utils'
import type { Folder, Note } from '@/types'

/** Returns up to `maxLength` characters of `content`, centred on the first match of `query`. */
function getSnippet(content: string, query: string, maxLength = 120) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const matchIndex = normalized.toLowerCase().indexOf(query.toLowerCase())
  if (matchIndex === -1) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trimEnd()}…` : normalized
  }

  const matchCenter = matchIndex + query.length / 2
  let start = Math.max(0, Math.round(matchCenter - maxLength / 2))
  const end = Math.min(normalized.length, start + maxLength)
  start = Math.max(0, end - maxLength)

  let snippet = normalized.slice(start, end)
  if (start > 0) snippet = `…${snippet.trimStart()}`
  if (end < normalized.length) snippet = `${snippet.trimEnd()}…`
  return snippet
}

/** Joins a folder and its ancestors' names with " / ", or "Unfiled" if the note has no folder. */
function folderPath(folders: Folder[], folderId: string | null): string {
  const segments: string[] = []
  let current = folders.find((folder) => folder.id === folderId)
  while (current) {
    segments.unshift(current.name)
    current = folders.find((folder) => folder.id === current!.parent_id)
  }
  return segments.length > 0 ? segments.join(' / ') : 'Unfiled'
}

/** Search mode: auto-focused input with a match-case toggle, debounced results below. */
export function SearchPanel() {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const [, setSidebarMode] = useSidebarMode()
  const { query, setQuery, matchCase, setMatchCase, results, isSearching } = useSearch()

  const trimmedQuery = query.trim()

  const handleSelect = (note: Note) => {
    navigate(`/app/notes/${note.id}`)
    setQuery('')
    setSidebarMode('files')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      setSidebarMode('files')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <label className="flex items-center justify-end gap-2 px-1 text-xs text-muted-foreground">
          <span className="font-medium">Aa</span>
          <Switch size="sm" checked={matchCase} onCheckedChange={setMatchCase} aria-label="Match case" />
        </label>
      </div>

      <ScrollArea className="flex-1">
        {trimmedQuery.length < MIN_QUERY_LENGTH ? (
          <p className="p-4 text-sm text-muted-foreground">Type to search your notes.</p>
        ) : isSearching && results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No notes match your search.</p>
        ) : (
          <ItemGroup className="gap-1 p-2">
            {results.map((note) => (
              <Item
                key={note.id}
                size="sm"
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(note)}
                onKeyDown={onActivateKey(() => handleSelect(note))}
                className="cursor-pointer gap-2"
              >
                <ItemContent>
                  <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
                  <ItemDescription className="truncate">{folderPath(folders, note.folder_id)}</ItemDescription>
                  <ItemDescription className="line-clamp-2">
                    {getSnippet(note.content, trimmedQuery)}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </ScrollArea>
    </div>
  )
}
