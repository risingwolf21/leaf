import { Search, X } from 'lucide-react'

type NoteListSearchProps = {
  value: string
  onChange: (value: string) => void
}

/** Local text filter scoped to the note-list panel's current view; independent of the sidebar's global Search mode. */
export function NoteListSearch({ value, onChange }: NoteListSearchProps) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 transition-colors focus-within:border-ring">
      <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes"
        className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
