import { ChevronRight, Folder, Leaf, PanelLeftClose, Search, Settings, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTree } from '@/components/sidebar/FileTree'
import { SearchPanel } from '@/components/sidebar/SearchPanel'
import { SidebarActionBar } from '@/components/sidebar/SidebarActionBar'
import { TagsPanel } from '@/components/sidebar/TagsPanel'
import { useNotesContext, type SidebarMode } from '@/context/NotesContext'
import { cn } from '@/lib/utils'

const MODES: { id: SidebarMode; label: string; icon: typeof Folder }[] = [
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'tags', label: 'Tags', icon: Tag },
]

/** Sidebar contents shared by the desktop sidebar, the mobile inline panel, and the mobile drawer. */
export function SidebarContent() {
  const navigate = useNavigate()
  const { sidebarMode, setSidebarMode, toggleSidebar } = useNotesContext()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">Leaf</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className="hidden md:flex"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
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

      {sidebarMode === 'files' && <SidebarActionBar />}

      <div className="flex-1 overflow-hidden">
        {sidebarMode === 'files' && (
          <ScrollArea className="h-full">
            <FileTree />
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
  )
}

/** Desktop: fixed 260px collapsible sidebar with a small re-expand tab when collapsed. */
export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useNotesContext()

  return (
    <>
      <aside
        className={cn(
          'hidden h-full shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 ease-in-out md:block',
          sidebarOpen ? 'w-[260px]' : 'w-0'
        )}
      >
        <div className="h-full w-[260px]">
          <SidebarContent />
        </div>
      </aside>
      {!sidebarOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="hidden h-full w-4 shrink-0 items-center justify-center border-r border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </>
  )
}
