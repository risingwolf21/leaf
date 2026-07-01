import { AppBar } from '@/components/AppBar'
import { useNotes } from '@/hooks/useNotes'

export default function HomePage() {
  const { isLoading } = useNotes()

  return (
    <div>
      <AppBar className="!border-b !shadow-sm" showNewNoteButton />
      <main className="flex-1 size-full pb-safe-bottom">
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {isLoading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
        </div>
      </main>
    </div>
  )
}
