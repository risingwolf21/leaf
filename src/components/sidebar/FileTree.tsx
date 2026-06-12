import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Eye, FileText, Folder as FolderIcon, MoreHorizontal, Pencil, UserX, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { useNotesContext } from '@/context/NotesContext'
import { sortNotes } from '@/hooks/useNotes'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { cn, onActivateKey } from '@/lib/utils'
import { FileTreeNode } from './FileTreeNode'
import type { NoteWithTags, SharedNote, Tag } from '@/types'

const UNFILED_DROPPABLE_ID = 'folder-drop-unfiled'

type ActiveDrag = { kind: 'note' | 'folder'; label: string }

/** Top-level sidebar tree: folders, unfiled notes, shared notes, and (when a tag filter is active) a flat filtered list. */
export function FileTree() {
  const { notes, folders, sortBy, tagFilter, sharedNotes, handleMoveNote, moveFolder, removeSelfFromNote } =
    useNotesContext()
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { kind: 'note' | 'folder'; id: string } | undefined
    if (!data) return

    if (data.kind === 'folder') {
      const folder = folders.find((f) => f.id === data.id)
      if (folder) setActiveDrag({ kind: 'folder', label: folder.name })
    } else {
      const note = notes.find((n) => n.id === data.id)
      if (note) setActiveDrag({ kind: 'note', label: note.title || 'Untitled' })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as { kind: 'note' | 'folder'; id: string } | undefined
    const overData = over.data.current as { kind: 'folder'; id: string | null } | undefined
    if (!activeData || !overData) return

    if (activeData.kind === 'folder') {
      if (activeData.id === overData.id) return
      moveFolder(activeData.id, overData.id)
    } else {
      handleMoveNote(activeData.id, overData.id)
    }
  }

  if (tagFilter.size > 0) return <TagFilteredView />

  const rootFolders = folders.filter((folder) => folder.parent_id === null)
  const unfiledNotes = sortNotes(notes.filter((note) => note.folder_id === null), sortBy)
  const isEmpty = rootFolders.length === 0 && unfiledNotes.length === 0 && sharedNotes.length === 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDrag(null)}>
      <ItemGroup className="gap-1 p-2">
        {rootFolders.map((folder) => (
          <FileTreeNode key={folder.id} type="folder" folder={folder} depth={0} />
        ))}

        <UnfiledSection notes={unfiledNotes} showHeading={rootFolders.length > 0} />

        {sharedNotes.length > 0 && (
          <>
            <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shared with me
            </div>
            {sharedNotes.map((note) => (
              <SharedNoteRow key={note.id} note={note} onRemove={removeSelfFromNote} />
            ))}
          </>
        )}

        {isEmpty && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notes yet. Create your first note to get started.
          </p>
        )}
      </ItemGroup>

      <DragOverlay>
        {activeDrag && (
          <div className="flex items-center gap-2 rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md">
            {activeDrag.kind === 'folder' ? (
              <FolderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{activeDrag.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/** Notes with no `folder_id`. Always droppable so notes can be dragged out of folders to un-file them. */
function UnfiledSection({ notes, showHeading }: { notes: NoteWithTags[]; showHeading: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: UNFILED_DROPPABLE_ID,
    data: { kind: 'folder', id: null },
  })

  if (!showHeading) {
    return (
      <>
        {notes.map((note) => (
          <FileTreeNode key={note.id} type="note" note={note} depth={0} />
        ))}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Unfiled</div>
      <div
        ref={setNodeRef}
        className={cn('flex min-h-2 flex-col gap-1 rounded-md', isOver && 'bg-accent ring-1 ring-primary')}
      >
        {notes.map((note) => (
          <FileTreeNode key={note.id} type="note" note={note} depth={0} />
        ))}
      </div>
    </div>
  )
}

function SharedNoteRow({ note, onRemove }: { note: SharedNote; onRemove: (id: string) => Promise<void> }) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { setMobileSidebarOpen } = useNotesContext()
  const isActive = activeNoteId === note.id
  const RoleIcon = note.my_role === 'editor' ? Pencil : Eye
  const roleLabel = note.my_role === 'editor' ? 'Can edit' : 'Can view'

  const open = () => {
    navigate(`/app/notes/${note.id}`)
    setMobileSidebarOpen(false)
  }

  const handleRemove = async () => {
    await onRemove(note.id)
    if (isActive) navigate('/app')
  }

  return (
    <Item
      variant={isActive ? 'muted' : 'default'}
      size="sm"
      role="button"
      tabIndex={0}
      aria-current={isActive || undefined}
      onClick={open}
      onKeyDown={onActivateKey(open)}
      className="group cursor-pointer gap-2"
    >
      <span className="size-5 shrink-0" />
      <ItemContent>
        <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
        <ItemDescription className="flex items-center gap-1">
          <span title={roleLabel} className="shrink-0">
            <RoleIcon className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="truncate">{note.owner_email}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Note actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => {
                if (window.confirm('Remove this note from your shared notes?')) {
                  handleRemove()
                }
              }}
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove from shared
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  )
}

/** Flat, filtered note list shown in Files mode when a tag (or "Untagged") filter is active. */
function TagFilteredView() {
  const { notes, tags, tagFilter, toggleTagFilter, sortBy } = useNotesContext()

  const filtered = tagFilter.has(UNTAGGED_FILTER_ID)
    ? notes.filter((note) => note.tags.length === 0)
    : notes.filter((note) => [...tagFilter].every((tagId) => note.tags.some((tag) => tag.id === tagId)))

  const sorted = sortNotes(filtered, sortBy)

  return (
    <ItemGroup className="gap-1 p-2">
      <div className="flex flex-wrap items-center gap-1.5 px-2 pb-1 text-xs text-muted-foreground">
        <span className="shrink-0">Filtering by:</span>
        {tagFilter.has(UNTAGGED_FILTER_ID) ? (
          <FilterChip label="Untagged notes" onRemove={() => toggleTagFilter(UNTAGGED_FILTER_ID)} />
        ) : (
          [...tagFilter].map((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            if (!tag) return null
            return <FilterChip key={tagId} tag={tag} onRemove={() => toggleTagFilter(tagId)} />
          })
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notes match this filter.</p>
      ) : (
        sorted.map((note) => <FileTreeNode key={note.id} type="note" note={note} depth={0} />)
      )}
    </ItemGroup>
  )
}

function FilterChip({ label, tag, onRemove }: { label?: string; tag?: Tag; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
      {tag && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden="true" />}
      <span className="truncate">{tag ? tag.name : label}</span>
      <button
        type="button"
        aria-label={`Remove ${tag ? tag.name : label} filter`}
        onClick={onRemove}
        className="rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
