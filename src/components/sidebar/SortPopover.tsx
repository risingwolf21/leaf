import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SortBy } from '@/types'

const SORT_LABELS: Record<SortBy, string> = {
  updated_at: 'Recent',
  created_at: 'Created',
  title_asc: 'A–Z',
  title_desc: 'Z–A',
}

/** Popover for choosing the note list's sort order, persisted via `useSortPreference`. */
export function SortPopover({ sortBy, setSortBy }: { sortBy: SortBy; setSortBy: (sortBy: SortBy) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label="Sort notes" className="shrink-0 gap-1">
            {SORT_LABELS[sortBy]}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {/* Radio items below are limited to SortBy; onValueChange is typed (value: string) => void. */}
        <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="updated_at">Last updated</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created_at">Date created</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title_asc">Title A–Z</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title_desc">Title Z–A</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
