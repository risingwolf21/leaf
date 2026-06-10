import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

interface NoteListProps {
  notes: Note[]
  folders: FolderType[]
  loading: boolean
  activeNoteId: string | null
  trashCount: number
  showTrash: boolean
  currentFolderId: string | null
  onNavigateFolder: (folderId: string | null) => void
  onSelectNote: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: string) => void
  onCreateFolder: () => Promise<FolderType | null>
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveNote: (noteId: string, folderId: string | null) => void
  onSelectTrash: () => void
}

function getSubtitle(content: string) {
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)

  if (!line) return 'No additional text'

  return line.replace(/^#{1,6}\s+/, '').replace(/[*_`>~]/g, '')
}

/** Flattens the folder tree into a depth-first list with depth, for the "Move to folder" menu. */
function flattenFolders(
  folders: FolderType[],
  parentId: string | null = null,
  depth = 0
): { folder: FolderType; depth: number }[] {
  return folders
    .filter((folder) => folder.parent_id === parentId)
    .flatMap((folder) => [
      { folder, depth },
      ...flattenFolders(folders, folder.id, depth + 1),
    ])
}

export function NoteList({
  notes,
  folders,
  loading,
  activeNoteId,
  trashCount,
  showTrash,
  currentFolderId,
  onNavigateFolder,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveNote,
  onSelectTrash,
}: NoteListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [renamingId])

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null

  const subfolders = useMemo(
    () => folders.filter((folder) => folder.parent_id === currentFolderId),
    [folders, currentFolderId]
  )

  const currentNotes = useMemo(
    () => notes.filter((note) => note.folder_id === currentFolderId),
    [notes, currentFolderId]
  )

  const moveTargets = useMemo(() => flattenFolders(folders), [folders])

  const startRename = (id: string, currentName: string) => {
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
              {moveTargets.length > 0 && <DropdownMenuSeparator />}
              {moveTargets.map(({ folder, depth }) => (
                <DropdownMenuItem
                  key={folder.id}
                  disabled={note.folder_id === folder.id}
                  onClick={() => onMoveNote(note.id, folder.id)}
                  style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
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

  const renderFolder = (folder: FolderType) => {
    const isRenaming = renamingId === folder.id

    return (
      <li key={folder.id} className="group/folder">
        <div
          className={cn(
            'flex w-full items-center gap-2 border-b border-border px-4 py-3 text-left transition-colors',
            !isRenaming && 'cursor-pointer hover:bg-accent'
          )}
          onClick={() => !isRenaming && onNavigateFolder(folder.id)}
        >
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => commitRename(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(folder.id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {folder.name}
            </span>
          )}
          {!isRenaming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Folder actions"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/folder:opacity-100 max-md:opacity-100"
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
                        `Delete "${folder.name}"? Subfolders will also be deleted, and all notes inside will become Unfiled.`
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
          {!isRenaming && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
      </li>
    )
  }

  const isEmpty = subfolders.length === 0 && currentNotes.length === 0

  return (
    <div className="flex h-full flex-col">
      {currentFolder && (
        <button
          type="button"
          onClick={() => onNavigateFolder(currentFolder.parent_id)}
          className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{currentFolder.name}</span>
        </button>
      )}

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
        ) : isEmpty ? (
          <p className="p-4 text-sm text-muted-foreground">
            {currentFolder
              ? 'This folder is empty.'
              : 'No notes yet. Create your first note to get started.'}
          </p>
        ) : (
          <ul className="flex flex-col">
            {subfolders.map(renderFolder)}
            {currentNotes.map(renderNote)}
          </ul>
        )}
      </ScrollArea>

      <button
        type="button"
        onClick={onSelectTrash}
        className={cn(
          'flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent',
          showTrash ? 'bg-accent text-foreground' : 'text-muted-foreground'
        )}
      >
        <Trash2 className="h-4 w-4" />
        <span className="flex-1">Trash</span>
        {trashCount > 0 && <Badge variant="secondary">{trashCount}</Badge>}
      </button>
    </div>
  )
}
