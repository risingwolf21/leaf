import { AppShell } from '@/components/AppShell'
import { useNotesContext } from '@/context/NotesContext'

export default function NoteListPage() {
  const { loading } = useNotesContext()

  return (
    <AppShell>
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        {loading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
      </div>
    </AppShell>
  )
}
