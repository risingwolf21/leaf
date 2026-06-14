import { FilePlus, FolderInput, FolderPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { useCreateFolder, useDeleteFolder, useFolders, useMoveFolder } from '@/hooks/useFolders'
import { useCreateNote } from '@/hooks/useNotes'
import { flattenFolders, INDENT_REM } from '@/lib/folderTree'
import { usePendingRename } from '@/lib/sidebarStore'
import type { Folder } from '@/types'

type FolderActionsMenuProps = {
  folder: Folder
  onStartRename: () => void
}

/** Dropdown menu of actions ("..." button) for a sidebar folder row: new note/subfolder, rename, move, delete. */
export function FolderActionsMenu({ folder, onStartRename }: FolderActionsMenuProps) {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const { setPendingRename } = usePendingRename()
  const deleteFolder = useDeleteFolder()
  const createFolder = useCreateFolder()
  const createNote = useCreateNote()
  const moveFolder = useMoveFolder()

  const moveTargets = flattenFolders(folders).filter(({ folder: target }) => target.id !== folder.id)

  const handleNewNoteInside = () => {
    createNote.mutate({ folderId: folder.id }, { onSuccess: (note) => navigate(`/app/notes/${note.id}`) })
  }

  const handleNewSubfolder = () => {
    createFolder.mutate(
      { name: 'New folder', parentId: folder.id },
      { onSuccess: (created) => setPendingRename({ kind: 'folder', id: created.id }) }
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${folder.name}"? Subfolders will also be deleted, and all notes inside will become Unfiled.`
      )
    ) {
      deleteFolder.mutate(folder.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuAction showOnHover aria-label="Folder actions">
            <MoreHorizontal />
          </SidebarMenuAction>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleNewNoteInside}>
          <FilePlus className="mr-2 h-4 w-4" />
          New note inside
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNewSubfolder}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New subfolder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onStartRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={folder.parent_id === null}
              onClick={() => moveFolder.mutate({ folderId: folder.id, newParentId: null })}
            >
              Root (no parent)
            </DropdownMenuItem>
            {moveTargets.length > 0 && <DropdownMenuSeparator />}
            {moveTargets.map(({ folder: target, depth }) => (
              <DropdownMenuItem
                key={target.id}
                disabled={folder.parent_id === target.id}
                onClick={() => moveFolder.mutate({ folderId: folder.id, newParentId: target.id })}
                style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
              >
                {target.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
