import { useParams } from 'react-router-dom'
import { AppBar } from '@/components/AppBar'
import { FolderBrowser } from '@/components/mobile/FolderBrowser'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFolders } from '@/hooks/useFolders'

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const { data: folders = [] } = useFolders()
  const isMobile = useIsMobile()

  const isVirtual = folderId === ALL_NOTES_FOLDER_ID || folderId === SHARED_WITH_ME_FOLDER_ID
  const parentId = isVirtual ? null : folders.find((folder) => folder.id === folderId)?.parent_id ?? null
  const navigateBackPath = parentId ? `/app/folders/${parentId}` : '/app'

  if (!isMobile) {
    // Desktop shows this folder's notes in the persistent note-list panel (MainLayout);
    // this page is just the right-hand placeholder until a note is opened.
    return (
      <div>
        <AppBar className="!border-b !shadow-sm" showNewNoteButton />
        <main className="flex-1 size-full pb-safe-bottom">
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Select a note or create a new one to get started.
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <AppBar className="!border-b !shadow-sm" primaryAction="back" navigateBackPath={navigateBackPath} />
      <main className="flex-1 size-full pb-safe-bottom">
        <FolderBrowser folderId={folderId ?? null} />
      </main>
    </div>
  )
}
