import { FolderPlus, Folder as FolderIcon, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { FolderRow } from '@/components/sidebar/FolderRow'
import { TagFilteredView } from '@/components/sidebar/TagFilteredView'
import { TagsPanel } from '@/components/sidebar/TagsPanel'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID, UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useCreateFolder } from '@/hooks/useCreateFolder'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { flattenFolders } from '@/lib/folderTree'
import { usePendingRename, useTagFilter } from '@/lib/sidebarStore'
import type { SortBy } from '@/types'

/**
 * The sidebar's single always-visible content area: fixed "All Notes" /
 * "Unfiled" / "Shared with me" nav links, a Folders section (flat,
 * depth-indented, no expand/collapse — each row navigates to the note-list
 * panel), and a collapsible Tags section. When a tag filter is active, the
 * Folders section is replaced by a flat filtered note list.
 */
export function FileTreeRoot({ sortBy }: { sortBy: SortBy }) {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { tagFilter } = useTagFilter()
  const { activeFolderId } = useActiveFolder()
  const { setPendingRename } = usePendingRename()
  const createFolder = useCreateFolder()
  const { folderId: activeFolderRouteId } = useParams<{ folderId: string }>()

  const handleCreateFolder = () => {
    createFolder.mutate(
      { name: 'New folder', parentId: activeFolderId },
      { onSuccess: (created) => setPendingRename({ kind: 'folder', id: created.id }) }
    )
  }

  const flatFolders = flattenFolders(folders)
  const unfiledCount = notes.filter((note) => note.folder_id === null).length
  const isEmpty = flatFolders.length === 0 && notes.length === 0 && sharedNotes.length === 0

  return (
    <div className="flex flex-col gap-0.5">
      {notes.length > 0 && (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFolderRouteId === ALL_NOTES_FOLDER_ID}
            onClick={() => navigate(`/app/folders/${ALL_NOTES_FOLDER_ID}`)}
          >
            <FolderIcon />
            <span className="truncate font-medium">All Notes</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {unfiledCount > 0 && (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFolderRouteId === UNFILED_FOLDER_ID}
            onClick={() => navigate(`/app/folders/${UNFILED_FOLDER_ID}`)}
          >
            <FolderIcon />
            <span className="truncate font-medium">Unfiled</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {sharedNotes.length > 0 && (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFolderRouteId === SHARED_WITH_ME_FOLDER_ID}
            onClick={() => navigate(`/app/folders/${SHARED_WITH_ME_FOLDER_ID}`)}
          >
            <Share2 />
            <span className="truncate font-medium">Shared with me</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {tagFilter.size > 0 ? (
        <TagFilteredView sortBy={sortBy} />
      ) : (
        <>
          <div className="flex items-center justify-between px-2 pt-3 pb-1">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Folders</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCreateFolder}
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {flatFolders.map(({ folder, depth }) => (
            <FolderRow key={folder.id} folder={folder} depth={depth} />
          ))}

          {isEmpty && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notes yet. Create your first note to get started.
            </p>
          )}
        </>
      )}

      <div className="mt-2 border-t border-border pt-2">
        <TagsPanel />
      </div>
    </div>
  )
}
