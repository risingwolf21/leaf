import { useEffect } from 'react'
import { Folder, Leaf, Search, Settings, Tag } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTreeRoot } from '@/components/sidebar/FileTree'
import { SearchPanel } from '@/components/sidebar/SearchPanel'
import { SidebarActionBar } from '@/components/sidebar/SidebarActionBar'
import { TagsPanel } from '@/components/sidebar/TagsPanel'
import { useSidebarMode, type SidebarMode } from '@/lib/sidebarStore'
import { useSortPreference } from '@/hooks/useSortPreference'
import { cn } from '@/lib/utils'
import { Sidebar as SidebarPrimitive, SidebarTrigger, useSidebar } from './ui/sidebar'

const MODES: { id: SidebarMode; label: string; icon: typeof Folder }[] = [
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'tags', label: 'Tags', icon: Tag },
]

/** App sidebar: branding header, mode switcher, action bar, file tree / search / tags, and a settings link. */
export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarMode, setSidebarMode] = useSidebarMode()
  const [sortBy, setSortBy] = useSortPreference()
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
          <span className="text-lg font-semibold text-foreground">Leaf</span>
          <SidebarTrigger className="ml-auto md:hidden" />
        </div>

        <div className="flex shrink-0 gap-1 border-b border-border p-1.5">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSidebarMode(id)}
              aria-label={label}
              aria-pressed={sidebarMode === id}
              title={label}
              className={cn(
                'flex flex-1 items-center justify-center rounded-md py-1.5 text-sm font-medium transition-colors',
                sidebarMode === id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {sidebarMode === 'files' && <SidebarActionBar sortBy={sortBy} setSortBy={setSortBy} />}

        <div className="flex-1 overflow-hidden">
          {sidebarMode === 'files' && (
            <ScrollArea className="h-full p-2">
              <FileTreeRoot sortBy={sortBy} />
            </ScrollArea>
          )}
          {sidebarMode === 'search' && <SearchPanel />}
          {sidebarMode === 'tags' && (
            <ScrollArea className="h-full">
              <TagsPanel />
            </ScrollArea>
          )}
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
