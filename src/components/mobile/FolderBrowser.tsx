import { Folder as FolderIcon, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { FolderCard } from '@/components/mobile/FolderCard'
import { FolderCreateMenu } from '@/components/mobile/FolderCreateMenu'
import { FolderViewToggle } from '@/components/mobile/FolderViewToggle'
import { NoteGridCard } from '@/components/mobile/NoteGridCard'
import { NoteListRow } from '@/components/mobile/NoteListRow'
import { useFolderContents } from '@/hooks/useFolderContents'
import { useFolders } from '@/hooks/useFolders'
import { useFolderViewMode } from '@/hooks/useFolderViewMode'
import { useNotes } from '@/hooks/useNotes'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useSortPreference } from '@/hooks/useSortPreference'
import { countDirectChildren } from '@/lib/folderTree'
import { cn } from '@/lib/utils'

type FolderBrowserProps = {
  folderId: string | null
}

/** Shared folder-contents browser: renders the root grid and every drill-down level via the same component. */
export function FolderBrowser({ folderId }: FolderBrowserProps) {
  const navigate = useNavigate()
  const [sortBy] = useSortPreference()
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { subfolders, notes: contents, isVirtual, isLoading } = useFolderContents(folderId, sortBy)
  const { viewMode, setViewMode } = useFolderViewMode()

  const handleOpenFolder = (id: string) => navigate(`/app/folders/${id}`)
  const handleOpenNote = (id: string) => navigate(`/app/notes/${id}`)

  const unfiledCount = notes.filter((note) => note.folder_id === null).length
  const isRoot = folderId === null
  const isEmpty = !isLoading && subfolders.length === 0 && contents.length === 0 && !(isRoot && (unfiledCount > 0 || sharedNotes.length > 0))

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-end">
        <FolderViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {isLoading ? (
        <p className="p-4 text-center text-sm text-muted-foreground">Loading…</p>
      ) : isEmpty ? (
        <p className="p-4 text-center text-sm text-muted-foreground">No folders or notes here yet.</p>
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-1')}>
          {isRoot && unfiledCount > 0 && (
            <FolderCard
              name="All Notes"
              count={unfiledCount}
              icon={<FolderIcon className="h-5 w-5" />}
              variant={viewMode}
              onOpen={() => handleOpenFolder(ALL_NOTES_FOLDER_ID)}
            />
          )}

          {isRoot && sharedNotes.length > 0 && (
            <FolderCard
              name="Shared with Me"
              count={sharedNotes.length}
              icon={<Share2 className="h-5 w-5" />}
              variant={viewMode}
              onOpen={() => handleOpenFolder(SHARED_WITH_ME_FOLDER_ID)}
            />
          )}

          {subfolders.map((folder) => (
            <FolderCard
              key={folder.id}
              name={folder.name}
              count={countDirectChildren(folder.id, folders, notes)}
              icon={<FolderIcon className="h-5 w-5" />}
              variant={viewMode}
              onOpen={() => handleOpenFolder(folder.id)}
            />
          ))}

          {contents.map((note) =>
            viewMode === 'grid' ? (
              <NoteGridCard key={note.id} note={note} onOpen={() => handleOpenNote(note.id)} />
            ) : (
              <NoteListRow key={note.id} note={note} onOpen={() => handleOpenNote(note.id)} />
            )
          )}
        </div>
      )}

      {!isVirtual && <FolderCreateMenu folderId={folderId} />}
    </div>
  )
}
