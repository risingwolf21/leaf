import { ChevronRight, Folder as FolderIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar'
import { FolderActionsMenu } from '@/components/sidebar/FolderActionsMenu'
import { NoteNode } from '@/components/sidebar/NoteNode'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { useFolders } from '@/hooks/useFolders'
import { useRenameFolder } from '@/hooks/useRenameFolder'
import { useNotes } from '@/hooks/useNotes'
import { useInlineRename } from '@/hooks/useInlineRename'
import { sortNotes } from '@/lib/notes'
import { cn } from '@/lib/utils'
import type { Folder, SortBy } from '@/types'

/** Renders a folder row, recursively rendering its subfolders and notes when expanded. */
export function FolderNode({ folder, sortBy }: { folder: Folder; sortBy: SortBy }) {
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const renameFolder = useRenameFolder()
  const { isRenaming, value, setValue, startRename, stopRename } = useInlineRename(
    { kind: 'folder', id: folder.id },
    folder.name
  )

  const subfolders = folders.filter((item) => item.parent_id === folder.id)
  const childNotes = sortNotes(notes.filter((note) => note.folder_id === folder.id), sortBy)
  const hasChildren = subfolders.length > 0 || childNotes.length > 0

  const commitRename = () => {
    stopRename()
    const trimmed = value.trim()
    if (trimmed && trimmed !== folder.name) renameFolder.mutate({ id: folder.id, name: trimmed })
  }

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible">
        <CollapsibleTrigger
          render={(triggerProps, state) => (
            <SidebarMenuButton {...triggerProps}>
              {hasChildren ? (
                <ChevronRight className={cn('transition-transform', state.open && 'rotate-90')} />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <FolderIcon />
              {isRenaming ? (
                <RenameInput value={value} onChange={setValue} onCommit={commitRename} onCancel={stopRename} />
              ) : (
                <span className="truncate">{folder.name}</span>
              )}
            </SidebarMenuButton>
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub className="pr-0 mr-0">
            {subfolders.map((sub) => (
              <FolderNode key={sub.id} folder={sub} sortBy={sortBy} />
            ))}
            {childNotes.map((note) => (
              <NoteNode key={note.id} note={note} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
      {!isRenaming && <FolderActionsMenu folder={folder} onStartRename={startRename} />}
    </SidebarMenuItem>
  )
}
