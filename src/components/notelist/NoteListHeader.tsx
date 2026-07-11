import { NoteListSearch } from '@/components/notelist/NoteListSearch'
import { SortPopover } from '@/components/sidebar/SortPopover'
import type { SortBy } from '@/types'
import { FolderOpen } from 'lucide-react'

type NoteListHeaderProps = {
  title: string
  count: number
  search: string
  onSearchChange: (value: string) => void
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
}

/** Note-list panel header: mobile sidebar-drawer trigger + search + sort, then the current view title and note count. */
export function NoteListHeader({ title, count, search, onSearchChange, sortBy, setSortBy }: NoteListHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col border-b border-border">
      <div className="flex items-center gap-2 p-3">
        <NoteListSearch value={search} onChange={onSearchChange} />
        <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-md font-bold text-muted-foreground">{title}</span>
        </div>
        <span className="shrink-0 text-md text-muted-foreground">
          {count} note{count === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}
