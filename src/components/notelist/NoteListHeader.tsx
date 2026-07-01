import { NoteListSearch } from '@/components/notelist/NoteListSearch'
import { SortPopover } from '@/components/sidebar/SortPopover'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { SortBy } from '@/types'

type NoteListHeaderProps = {
  title: string
  count: number
  search: string
  onSearchChange: (value: string) => void
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
}

/** Note-list panel header: mobile sidebar-drawer trigger, current view title + note count, a local search filter, and sort. */
export function NoteListHeader({ title, count, search, onSearchChange, sortBy, setSortBy }: NoteListHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-1">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <span className="truncate text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {count} note{count === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <NoteListSearch value={search} onChange={onSearchChange} />
        <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
      </div>
    </div>
  )
}
