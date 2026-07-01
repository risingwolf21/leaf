import { TrashView } from '@/components/TrashView'
import { useEmptyTrash } from '@/hooks/useEmptyTrash'
import { usePermanentlyDeleteNote } from '@/hooks/usePermanentlyDeleteNote'
import { useRestoreNote } from '@/hooks/useRestoreNote'
import { useTrashedNotes } from '@/hooks/useTrashedNotes'
import { useSetAppBar } from '@/lib/appBarStore'

export default function TrashPage() {
  const { data: trashedNotes = [] } = useTrashedNotes()
  const restoreNote = useRestoreNote()
  const permanentlyDeleteNote = usePermanentlyDeleteNote()
  const emptyTrash = useEmptyTrash()
  useSetAppBar()

  return (
    <div className="size-full pb-safe-bottom">
      <TrashView
        notes={trashedNotes}
        onRestore={restoreNote.mutate}
        onPermanentlyDelete={permanentlyDeleteNote.mutate}
        onEmptyTrash={emptyTrash.mutate}
      />
    </div>
  )
}
