import { AppShell } from '@/components/AppShell'
import { TrashView } from '@/components/TrashView'
import { useNotesContext } from '@/context/NotesContext'

export default function TrashPage() {
  const { trashedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } = useNotesContext()

  return (
    <AppShell>
      <TrashView
        notes={trashedNotes}
        onRestore={restoreNote}
        onPermanentlyDelete={permanentlyDeleteNote}
        onEmptyTrash={emptyTrash}
      />
    </AppShell>
  )
}
