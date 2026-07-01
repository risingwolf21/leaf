import { useSetAppBar } from '@/lib/appBarStore'

/**
 * Desktop shows this folder's notes in the persistent note-list panel
 * (MainLayout); this page is just the right-hand placeholder until a note
 * is opened. On mobile, MainLayout hides this page entirely in favor of the
 * note-list panel taking over the full viewport.
 */
export default function FolderPage() {
  useSetAppBar({ showNewNoteButton: true })

  return (
    <div className="flex h-full items-center justify-center p-4 pb-safe-bottom text-center text-sm text-muted-foreground">
      Select a note or create a new one to get started.
    </div>
  )
}
