import { Folder as FolderIcon, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { FolderNode } from '@/components/sidebar/FolderNode'
import { TagFilteredView } from '@/components/sidebar/TagFilteredView'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useTagFilter } from '@/lib/sidebarStore'
import type { SortBy } from '@/types'

/**
 * Top-level sidebar tree: fixed "All notes"/"Shared with me" nav links (which
 * route to the note-list panel), real folders, and (when a tag filter is
 * active) a flat filtered list.
 */
export function FileTreeRoot({ sortBy }: { sortBy: SortBy }) {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { tagFilter } = useTagFilter()
  const { folderId: activeFolderRouteId } = useParams<{ folderId: string }>()

  if (tagFilter.size > 0) return <TagFilteredView sortBy={sortBy} />

  const rootFolders = folders.filter((folder) => folder.parent_id === null)
  const unfiledCount = notes.filter((note) => note.folder_id === null).length
  const isEmpty = rootFolders.length === 0 && unfiledCount === 0 && sharedNotes.length === 0

  return (
    <div className="flex flex-col gap-0.5">
      {unfiledCount > 0 && (
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeFolderRouteId === ALL_NOTES_FOLDER_ID}
            onClick={() => navigate(`/app/folders/${ALL_NOTES_FOLDER_ID}`)}
          >
            <FolderIcon />
            <span className="truncate font-medium">All notes</span>
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

      {rootFolders.length > 0 && (
        <div className="px-2 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Folders
        </div>
      )}

      {rootFolders.map((folder) => (
        <FolderNode key={folder.id} folder={folder} sortBy={sortBy} />
      ))}

      {isEmpty && (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          No notes yet. Create your first note to get started.
        </p>
      )}
    </div>
  )
}
