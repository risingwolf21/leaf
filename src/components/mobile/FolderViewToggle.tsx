import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FolderViewMode } from '@/hooks/useFolderViewMode'

type FolderViewToggleProps = {
  viewMode: FolderViewMode
  onChange: (mode: FolderViewMode) => void
}

/** Two icon buttons for switching the folder browser between grid and list layouts. */
export function FolderViewToggle({ viewMode, onChange }: FolderViewToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
        onClick={() => onChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        onClick={() => onChange('list')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
