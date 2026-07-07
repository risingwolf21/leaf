import { ChevronDown, Folder as FolderIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useFolders } from '@/hooks/useFolders'
import { useMoveNote } from '@/hooks/useMoveNote'
import { flattenFolders, INDENT_REM } from '@/lib/folderTree'
import type { Note } from '@/types'

type NoteFolderPickerProps = {
  note: Note
}

/** Inline folder picker for the note meta row; moves the note via the same mutation the sidebar's "Move to folder" submenu uses. */
export function NoteFolderPicker({ note }: NoteFolderPickerProps) {
  const { data: folders = [] } = useFolders()
  const moveNote = useMoveNote()

  const currentFolder = folders.find((folder) => folder.id === note.folder_id)
  const moveTargets = flattenFolders(folders)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <FolderIcon className="h-3 w-3" />
            <span className="max-w-32 truncate">{currentFolder?.name ?? 'Unfiled'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          disabled={note.folder_id === null}
          onClick={() => moveNote.mutate({ noteId: note.id, folderId: null })}
        >
          Unfiled
        </DropdownMenuItem>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
