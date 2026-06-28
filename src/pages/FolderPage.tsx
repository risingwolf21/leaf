import { useParams } from 'react-router-dom'
import { AppBar } from '@/components/AppBar'
import { FolderBrowser } from '@/components/mobile/FolderBrowser'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const { data: folders = [] } = useFolders()

  const isVirtual = folderId === ALL_NOTES_FOLDER_ID || folderId === SHARED_WITH_ME_FOLDER_ID
  const parentId = isVirtual ? null : folders.find((folder) => folder.id === folderId)?.parent_id ?? null
  const navigateBackPath = parentId ? `/app/folders/${parentId}` : '/app'

  return (
    <div>
      <AppBar className="!border-b !shadow-sm" primaryAction="back" navigateBackPath={navigateBackPath} />
      <main className="flex-1 size-full pb-safe-bottom">
        <FolderBrowser folderId={folderId ?? null} />
      </main>
    </div>
  )
}
