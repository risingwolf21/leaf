import { AppBar } from '@/components/AppBar'
import { TrashView } from '@/components/TrashView'
import { useNotesContext } from '@/context/NotesContext'

export default function TrashPage() {
  const { trashedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } = useNotesContext()

  return (
    <div>
      <AppBar
        className='!border-b !shadow-sm'
        title={""}
      />
      <main className='flex-1 size-full pb-safe-bottom'>
        <TrashView
          notes={trashedNotes}
          onRestore={restoreNote}
          onPermanentlyDelete={permanentlyDeleteNote}
          onEmptyTrash={emptyTrash}
        />
      </main>
    </div>
  )
}
