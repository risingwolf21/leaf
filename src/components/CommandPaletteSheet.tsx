import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Drawer } from '@base-ui/react/drawer'
import { useNotes } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useCreateFolder } from '@/hooks/useCreateFolder'
import { useTheme } from '@/hooks/useTheme'
import { exportAllNotes } from '@/lib/export'
import { cn } from '@/lib/utils'
import { CommandResults } from '@/components/CommandResults'
import type { NoteWithTags, Folder } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPaletteSheet({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { themePreference, setThemePreference } = useTheme()
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()
  const createNote = useCreateNote()
  const createFolder = useCreateFolder()

  const handleClose = () => {
    onOpenChange(false)
    setQuery('')
  }

  const folderMap = new Map((folders as Folder[]).map((f) => [f.id, f.name]))

  const handleNote = (note: NoteWithTags) => {
    navigate(`/app/notes/${note.id}`)
    handleClose()
  }

  const handleCommand = (commandId: string) => {
    handleClose()

    switch (commandId) {
      case 'new-note':
        createNote.mutate(
          { folderId: null, fields: {} },
          { onSuccess: (note) => navigate(`/app/notes/${note.id}`) }
        )
        break
      case 'new-folder':
        createFolder.mutate({ name: 'New folder', parentId: null })
        break
      case 'toggle-theme':
        setThemePreference(themePreference === 'dark' ? 'light' : 'dark')
        break
      case 'settings':
        navigate('/app/settings')
        break
      case 'trash':
        navigate('/app/trash')
        break
      case 'help':
        navigate('/help')
        break
      case 'export':
        void exportAllNotes(notes, folders as Folder[])
        break
      case 'focus-mode':
        toast('Focus mode coming soon')
        break
    }
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen) => { if (!nextOpen) handleClose() }}
      swipeDirection="down"
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-black/10 transition-opacity duration-150',
            'data-ending-style:opacity-0 data-starting-style:opacity-0',
            'supports-backdrop-filter:backdrop-blur-xs'
          )}
        />
        <Drawer.Popup
          initialFocus={inputRef}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl',
            'bg-popover text-sm text-popover-foreground shadow-lg',
            'pb-[env(safe-area-inset-bottom)]',
            'transition duration-200 ease-in-out',
            'data-ending-style:translate-y-full data-starting-style:translate-y-full'
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes or run a command…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
          </div>

          <div className="overflow-y-auto py-2">
            <CommandResults
              query={query}
              notes={notes}
              folderMap={folderMap}
              onSelectNote={handleNote}
              onSelectCommand={handleCommand}
            />
          </div>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
