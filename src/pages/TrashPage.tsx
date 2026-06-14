import { AppBar } from '@/components/AppBar'
import { TrashView } from '@/components/TrashView'
import { useEmptyTrash, usePermanentlyDeleteNote, useRestoreNote, useTrashedNotes } from '@/hooks/useNotes'

export default function TrashPage() {
  const { data: trashedNotes = [] } = useTrashedNotes()
  const restoreNote = useRestoreNote()
  const permanentlyDeleteNote = usePermanentlyDeleteNote()
  const emptyTrash = useEmptyTrash()

  return (
    <div>
      <AppBar
        className='!border-b !shadow-sm'
        title={""}
      />
      <main className='flex-1 size-full pb-safe-bottom'>
        <TrashView
          notes={trashedNotes}
          onRestore={restoreNote.mutate}
          onPermanentlyDelete={permanentlyDeleteNote.mutate}
          onEmptyTrash={emptyTrash.mutate}
        />
      </main>
    </div>
  )
}
