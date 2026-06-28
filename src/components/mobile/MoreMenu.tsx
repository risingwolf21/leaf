import { LayoutTemplate, MoreHorizontal, Settings, Trash2, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Overflow menu for mobile pages without a sidebar, surfacing Settings/Trash/Templates/Import. */
export function MoreMenu() {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate('/app/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/app/trash')}>
          <Trash2 className="mr-2 h-4 w-4" />
          Trash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/app/templates')}>
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Templates
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/app/import')}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
