import { useEffect } from 'react'
import { Leaf, Search, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTreeRoot } from '@/components/sidebar/FileTreeRoot'
import { SidebarActionBar } from '@/components/sidebar/SidebarActionBar'
import { openCommandPalette } from '@/hooks/useCommandPalette'
import type { SortBy } from '@/types'
import { Sidebar as SidebarPrimitive, SidebarTrigger, useSidebar } from './ui/sidebar'

type SidebarProps = {
  sortBy: SortBy
}

/** App sidebar: branding header, action bar, file tree, and a settings link. */
export function Sidebar({ sortBy }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  // On mobile the sidebar takes the full screen, so hide it whenever navigation
  // reveals a page (e.g. opening a note) to act like the previous "page".
  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [location.pathname, isMobile, setOpenMobile])

  return (
    <SidebarPrimitive>
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-medium text-foreground">Leaf</span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={openCommandPalette}
              aria-label="Open command palette"
              title="Command palette (⌘K)"
            >
              <Search className="h-4 w-4" />
            </Button>
            <SidebarTrigger className="md:hidden" />
          </div>
        </div>

        <SidebarActionBar />

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
