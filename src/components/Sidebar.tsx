import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTreeRoot } from '@/components/sidebar/FileTreeRoot'
import type { SortBy } from '@/types'
import { Sidebar as SidebarPrimitive } from './ui/sidebar'

type SidebarProps = {
  sortBy: SortBy
}

export function Sidebar({ sortBy }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <SidebarPrimitive>
      <div className="flex h-full flex-col">

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2">
            <FileTreeRoot sortBy={sortBy} />
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/app/settings')}>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </SidebarPrimitive>
  )
}
