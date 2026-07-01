import { useSetAppBar } from '@/lib/appBarStore'
import { useNotes } from '@/hooks/useNotes'

export default function HomePage() {
  const { isLoading } = useNotes()
  useSetAppBar({ showNewNoteButton: true })

  return (
    <div className="flex h-full items-center justify-center p-4 pb-safe-bottom text-center text-sm text-muted-foreground">
      {isLoading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
    </div>
  )
}
