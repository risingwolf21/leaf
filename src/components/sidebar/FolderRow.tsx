import { Folder as FolderIcon, FolderOpen } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FolderActionsMenu } from '@/components/sidebar/FolderActionsMenu'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useInlineRename } from '@/hooks/useInlineRename'
import { useRenameFolder } from '@/hooks/useRenameFolder'
import { INDENT_REM } from '@/lib/folderTree'
import type { Folder } from '@/types'

type FolderRowProps = {
  folder: Folder
  depth: number
}

/** Flat, depth-indented folder row: navigates to the folder's notes in the note-list panel. */
export function FolderRow({ folder, depth }: FolderRowProps) {
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { folderId: activeFolderRouteId } = useParams<{ folderId: string }>()
  const renameFolder = useRenameFolder()
  const { isRenaming, value, setValue, startRename, stopRename } = useInlineRename(
    { kind: 'folder', id: folder.id },
    folder.name
  )

  const isActive = activeFolderRouteId === folder.id

  const open = () => {
    navigate(`/app/folders/${folder.id}`)
    setOpenMobile(false)
  }

  const commitRename = () => {
    stopRename()
    const trimmed = value.trim()
    if (trimmed && trimmed !== folder.name) renameFolder.mutate({ id: folder.id, name: trimmed })
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        render={isRenaming ? <div /> : undefined}
        onClick={isRenaming ? undefined : open}
        style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
      >
        {isActive ? <FolderOpen /> : <FolderIcon />}
        {isRenaming ? (
          <RenameInput value={value} onChange={setValue} onCommit={commitRename} onCancel={stopRename} />
        ) : (
          <span className="truncate">{folder.name}</span>
        )}
      </SidebarMenuButton>
      {!isRenaming && <FolderActionsMenu folder={folder} onStartRename={startRename} />}
    </SidebarMenuItem>
  )
}
