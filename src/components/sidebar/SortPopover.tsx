import { ArrowUpDown } from 'lucide-react'
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

/** Popover for choosing the Files mode sort order, persisted via `useSortPreference`. */
export function SortPopover({ sortBy, setSortBy }: { sortBy: SortBy; setSortBy: (sortBy: SortBy) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Sort notes" className="shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {/* Radio items below are limited to SortBy; onValueChange is typed (value: string) => void. */}
        <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="updated_at">Last updated</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title_asc">Title A–Z</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title_desc">Title Z–A</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created_at">Date created</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
