import { COMMANDS } from '@/lib/commands'
import { cn } from '@/lib/utils'
import type { NoteWithTags } from '@/types'

type Props = {
  query: string
  notes: NoteWithTags[]
  folderMap: Map<string, string>
  onSelectNote: (note: NoteWithTags) => void
  onSelectCommand: (commandId: string) => void
}

function matches(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

type ItemProps = {
  className?: string
  onClick: () => void
  children: React.ReactNode
}

function CommandItem({ onClick, children, className }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        className
      )}
    >
      {children}
    </button>
  )
}

export function CommandResults({ query, notes, folderMap, onSelectNote, onSelectCommand }: Props) {
  const filteredNotes = notes
    .filter((n) => !n.deleted_at && matches(n.title, query))
    .slice(0, 8)

  const filteredCommands = COMMANDS.filter((c) => !query || matches(c.label, query))

  const isEmpty = filteredNotes.length === 0 && filteredCommands.length === 0

  if (isEmpty) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results found.</p>
    )
  }

  return (
    <>
      {filteredNotes.length > 0 && (
        <CommandGroup label="Notes">
          {filteredNotes.map((note) => (
            <CommandItem key={note.id} onClick={() => onSelectNote(note)}>
              <span className="flex-1 truncate text-left">{note.title || 'Untitled'}</span>
              {note.folder_id && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {folderMap.get(note.folder_id) ?? ''}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {filteredCommands.length > 0 && (
        <CommandGroup label="Actions">
          {filteredCommands.map((cmd) => {
            const Icon = cmd.icon
            return (
              <CommandItem key={cmd.id} onClick={() => onSelectCommand(cmd.id)}>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {cmd.shortcut}
                  </kbd>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}
    </>
  )
}
