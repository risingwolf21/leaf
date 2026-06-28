import { useParams } from 'react-router-dom'
import { AppBar } from '@/components/AppBar'
import { FolderBrowser } from '@/components/mobile/FolderBrowser'

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>()

  return (
    <div>
      <AppBar className="!border-b !shadow-sm" primaryAction="back" />
      <main className="flex-1 size-full pb-safe-bottom">
        <FolderBrowser folderId={folderId ?? null} />
      </main>
    </div>
  )
}
