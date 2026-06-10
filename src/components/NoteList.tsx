import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Folder as FolderType, Note } from '@/types'

const UNFILED_ID = 'unfiled'

interface NoteListProps {
  notes: Note[]
  folders: FolderType[]
  loading: boolean
  activeNoteId: string | null
  onSelectNote: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  onCreateFolder: () => Promise<FolderType | null>
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveNote: (noteId: string, folderId: string | null) => void
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
  folders,
  loading,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveNote,
}: NoteListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingId])

  const notesByFolder = useMemo(() => {
    const map = new Map<string | null, Note[]>()
    for (const note of notes) {
      const key = note.folder_id
      const list = map.get(key)
      if (list) list.push(note)
      else map.set(key, [note])
    }
    return map
  }, [notes])

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startRename = (id: string, currentName: string) => {
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const commitRename = (id: string) => {
    const name = renameValue.trim()
    if (name) onRenameFolder(id, name)
    setRenamingId(null)
  }

  const handleCreateFolder = async () => {
    const folder = await onCreateFolder()
    if (folder) startRename(folder.id, folder.name)
  }

  const renderNote = (note: Note) => (
    <li key={note.id} className="group relative">
      <button
        type="button"
        onClick={() => onSelectNote(note)}
        className={cn(
          'w-full border-b border-border px-4 py-3 pl-9 text-left transition-colors hover:bg-accent',
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Note actions"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                disabled={note.folder_id === null}
                onClick={() => onMoveNote(note.id, null)}
              >
                Unfiled
              </DropdownMenuItem>
              {folders.length > 0 && <DropdownMenuSeparator />}
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  disabled={note.folder_id === folder.id}
                  onClick={() => onMoveNote(note.id, folder.id)}
                >
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => {
              if (window.confirm('Delete this note? This cannot be undone.')) {
                onDeleteNote(note.id)
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )

  const renderSection = (
    id: string,
    name: string,
    sectionNotes: Note[],
    folder?: FolderType
  ) => {
    const isCollapsed = collapsed.has(id)
    const isRenaming = renamingId === id

    return (
      <li key={id}>
        <div
          className={cn(
            'group/folder flex w-full items-center gap-2 border-b border-border px-2 py-2 text-left transition-colors',
            !isRenaming && 'cursor-pointer hover:bg-accent'
          )}
          onClick={() => !isRenaming && toggleCollapsed(id)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => commitRename(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <span
              className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
              onDoubleClick={(e) => {
                if (!folder) return
                e.stopPropagation()
                startRename(folder.id, folder.name)
              }}
            >
              {name}
            </span>
          )}
          {folder && !isRenaming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Folder actions"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/folder:opacity-100 max-md:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    startRename(folder.id, folder.name)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (
                      window.confirm(
                        `Delete "${folder.name}"? Notes inside will become Unfiled.`
                      )
                    ) {
                      onDeleteFolder(folder.id)
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {!isCollapsed && (
          <ul className="flex flex-col">{sectionNotes.map(renderNote)}</ul>
        )}
      </li>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b border-border p-3">
        <Button onClick={onCreateNote} className="flex-1 justify-center gap-2">
          <Plus className="h-4 w-4" />
          New note
        </Button>
        <Button onClick={handleCreateFolder} variant="outline" className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New folder
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading notes…</p>
        ) : notes.length === 0 && folders.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No notes yet. Create your first note to get started.
          </p>
        ) : (
          <ul className="flex flex-col">
            {folders.map((folder) =>
              renderSection(folder.id, folder.name, notesByFolder.get(folder.id) ?? [], folder)
            )}
            {renderSection(UNFILED_ID, 'Unfiled', notesByFolder.get(null) ?? [])}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
