import { RotateCcw, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

interface TrashViewProps {
  notes: Note[]
  onRestore: (id: string) => void
  onPermanentlyDelete: (id: string) => void
  onEmptyTrash: () => void
}

function formatTrashedDate(dateString: string | null) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TrashView({ notes, onRestore, onPermanentlyDelete, onEmptyTrash }: TrashViewProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-content flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Trash</h1>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={notes.length === 0}>
              Empty trash
            </Button>}/>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Empty trash?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {notes.length}{' '}
                {notes.length === 1 ? 'note' : 'notes'}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onEmptyTrash}
                className={cn(buttonVariants({ variant: 'destructive' }))}
              >
                Empty trash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Trash is empty.</p>
        ) : (
          <ul className="flex flex-col">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex items-center gap-2 border-b border-border py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {note.title || 'Untitled'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Trashed {formatTrashedDate(note.deleted_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Restore note"
                  onClick={() => onRestore(note.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete permanently"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      window.confirm('Permanently delete this note? This cannot be undone.')
                    ) {
                      onPermanentlyDelete(note.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
