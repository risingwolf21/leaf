import {
  FolderInput,
  History,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Share2,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuAction } from '@/components/ui/sidebar'
import { AddTagSubmenu } from '@/components/sidebar/AddTagSubmenu'
import { UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'
import { useMoveNote } from '@/hooks/useMoveNote'
import { useDeleteNote } from '@/hooks/useDeleteNote'
import { useNotes } from '@/hooks/useNotes'
import { useShareNote } from '@/hooks/useShareNote'
import { useSortPreference } from '@/hooks/useSortPreference'
import { useTogglePin } from '@/hooks/useTogglePin'
import { flattenFolders, INDENT_REM } from '@/lib/folderTree'
import { sortNotes } from '@/lib/notes'
import { notePath } from '@/lib/routes'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { PrintButton } from '@/components/PrintButton'
import type { NoteWithTags } from '@/types'

type NoteActionsMenuProps = {
  note: NoteWithTags
  onOpen: () => void
  onStartRename: () => void
  /** Custom trigger element; defaults to a sidebar-style hover-reveal "..." button (requires a SidebarMenuItem ancestor). */
  trigger?: React.ReactElement
}

/** Dropdown menu of actions ("..." button) for a note row: open, rename, pin, move, tag, share, delete. */
export function NoteActionsMenu({ note, onOpen, onStartRename, trigger }: NoteActionsMenuProps) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const [sortBy] = useSortPreference()
  const { openVersionHistory } = useVersionHistorySheet()
  const moveNote = useMoveNote()
  const togglePin = useTogglePin()
  const deleteNote = useDeleteNote()
  const shareNote = useShareNote()

  const isActive = activeNoteId === note.id
  const moveTargets = flattenFolders(folders)

  const handleCopyShareLink = () => {
    shareNote.mutate(note.id, {
      onSuccess: ({ url }) => {
        navigator.clipboard.writeText(url)
        toast.success('Share link copied to clipboard')
      },
    })
  }

  const handleDelete = () => {
    if (!window.confirm('Move this note to trash?')) return
    if (isActive) {
      const siblings = sortNotes(
        notes.filter((sibling) => sibling.folder_id === note.folder_id && sibling.id !== note.id),
        sortBy
      )
      const fallbackPath = `/app/folders/${note.folder_id ?? UNFILED_FOLDER_ID}`
      navigate(siblings.length > 0 ? notePath(siblings[0].id, note.folder_id) : fallbackPath)
    }
    deleteNote.mutate(note.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger ?? (
            <SidebarMenuAction showOnHover aria-label="Note actions">
              <MoreHorizontal />
            </SidebarMenuAction>
          )
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
        <DropdownMenuItem onClick={onStartRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => togglePin.mutate({ id: note.id, pinned: !note.pinned })}>
          {note.pinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" />
              Unpin note
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" />
              Pin note
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="mr-2 h-4 w-4" />
            Move to folder
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={note.folder_id === null}
              onClick={() => moveNote.mutate({ noteId: note.id, folderId: null })}
            >
              Unfiled
            </DropdownMenuItem>
            {moveTargets.length > 0 && <DropdownMenuSeparator />}
            {moveTargets.map(({ folder, depth }) => (
              <DropdownMenuItem
                key={folder.id}
                disabled={note.folder_id === folder.id}
                onClick={() => moveNote.mutate({ noteId: note.id, folderId: folder.id })}
                style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
              >
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <AddTagSubmenu note={note} />
        <DropdownMenuItem onClick={() => openVersionHistory(note)}>
          <History className="mr-2 h-4 w-4" />
          Version history
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyShareLink}>
          <Share2 className="mr-2 h-4 w-4" />
          Copy share link
        </DropdownMenuItem>
        <PrintButton note={note} />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Move to trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
