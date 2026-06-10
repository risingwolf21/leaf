import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

interface NoteListProps {
  notes: Note[]
  loading: boolean
  activeNoteId: string | null
  onSelectNote: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
}

function getSubtitle(content: string) {
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)

  if (!line) return 'No additional text'

  return line.replace(/^#{1,6}\s+/, '').replace(/[*_`>~]/g, '')
}

export function NoteList({
  notes,
  loading,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
}: NoteListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <Button onClick={onCreateNote} className="w-full justify-center gap-2">
          <Plus className="h-4 w-4" />
          New note
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No notes yet. Create your first note to get started.
          </p>
        ) : (
          <ul className="flex flex-col">
            {notes.map((note) => (
              <li key={note.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelectNote(note)}
                  className={cn(
                    'w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent',
                    activeNoteId === note.id && 'bg-accent'
                  )}
                >
                  <p className="truncate pr-8 text-sm font-medium text-foreground">
                    {note.title || 'Untitled'}
                  </p>
                  <p className="mt-0.5 truncate pr-8 text-xs text-muted-foreground">
                    {getSubtitle(note.content)}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label="Delete note"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Delete this note? This cannot be undone.')) {
                      onDeleteNote(note.id)
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
