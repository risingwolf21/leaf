import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  ChevronRight,
  FilePlus,
  FileText,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Share2,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
import { useNotesContext } from '@/context/NotesContext'
import { sortNotes } from '@/hooks/useNotes'
import { cn, onActivateKey } from '@/lib/utils'
import type { Folder, NoteWithTags } from '@/types'

export const INDENT_REM = 1

/** Flattens the folder tree into a depth-first list with depth, for "move to folder" menus. */
export function flattenFolders(
  folders: Folder[],
  parentId: string | null = null,
  depth = 0
): { folder: Folder; depth: number }[] {
  return folders
    .filter((folder) => folder.parent_id === parentId)
    .flatMap((folder) => [
      { folder, depth },
      ...flattenFolders(folders, folder.id, depth + 1),
    ])
}

type FileTreeNodeProps =
  | { type: 'folder'; folder: Folder; depth: number }
  | { type: 'note'; note: NoteWithTags; depth: number }

/** Renders a single folder (recursive, with its subfolders and notes) or note row in the sidebar file tree. */
export function FileTreeNode(props: FileTreeNodeProps) {
  if (props.type === 'folder') return <FolderNode folder={props.folder} depth={props.depth} />
  return <NoteNode note={props.note} depth={props.depth} />
}

function FolderNode({ folder, depth }: { folder: Folder; depth: number }) {
  const navigate = useNavigate()
  const {
    folders,
    notes,
    sortBy,
    collapsedFolderIds,
    toggleFolderCollapsed,
    renamingFolderId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
    handleDeleteFolder,
    handleCreateSubfolder,
    moveFolder,
    createNote,
  } = useNotesContext()

  const subfolders = folders.filter((item) => item.parent_id === folder.id)
  const childNotes = sortNotes(notes.filter((note) => note.folder_id === folder.id), sortBy)
  const hasChildren = subfolders.length > 0 || childNotes.length > 0
  const isCollapsed = collapsedFolderIds.has(folder.id)
  const isRenaming = renamingFolderId === folder.id

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `folder-${folder.id}`,
    data: { kind: 'folder', id: folder.id },
  })
  const { setNodeRef: setDropRef, isOver, active } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: { kind: 'folder', id: folder.id },
  })

  const isSelfDrag = active?.data.current?.kind === 'folder' && active.data.current?.id === folder.id
  const showDropHighlight = isOver && !isSelfDrag

  const toggleOpen = () => hasChildren && toggleFolderCollapsed(folder.id)
  const moveTargets = flattenFolders(folders).filter(({ folder: target }) => target.id !== folder.id)

  const handleNewNoteInside = async () => {
    const note = await createNote(folder.id)
    if (note) {
      navigate(`/app/notes/${note.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div ref={setDropRef} className={cn('rounded-md', showDropHighlight && 'bg-accent ring-1 ring-primary')}>
        <div ref={setDragRef} className={cn(isDragging && 'opacity-40')}>
          <Item
            variant="default"
            size="sm"
            role="button"
            tabIndex={0}
            onClick={() => !isRenaming && toggleOpen()}
            onKeyDown={onActivateKey(() => !isRenaming && toggleOpen())}
            className="group cursor-pointer gap-2"
            style={{ paddingLeft: `${0.75 + depth * INDENT_REM}rem` }}
          >
            <button
              type="button"
              aria-label="Drag to move"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing max-md:opacity-100"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            {hasChildren ? (
              <button
                type="button"
                aria-label={isCollapsed ? `Expand ${folder.name}` : `Collapse ${folder.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolderCollapsed(folder.id)
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform', !isCollapsed && 'rotate-90')} />
              </button>
            ) : (
              <span className="size-5 shrink-0" />
            )}
            <ItemMedia>
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => handleCommitRename(folder.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') handleCommitRename(folder.id)
                    if (e.key === 'Escape') handleCancelRename()
                  }}
                  className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              ) : (
                <ItemTitle className="truncate">{folder.name}</ItemTitle>
              )}
            </ItemContent>
            {!isRenaming && (
              <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Folder actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleNewNoteInside}>
                      <FilePlus className="mr-2 h-4 w-4" />
                      New note inside
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateSubfolder(folder.id)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      New subfolder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartRename(folder)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FolderInput className="mr-2 h-4 w-4" />
                        Move
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          disabled={folder.parent_id === null}
                          onClick={() => moveFolder(folder.id, null)}
                        >
                          Root (no parent)
                        </DropdownMenuItem>
                        {moveTargets.length > 0 && <DropdownMenuSeparator />}
                        {moveTargets.map(({ folder: target, depth: targetDepth }) => (
                          <DropdownMenuItem
                            key={target.id}
                            disabled={folder.parent_id === target.id}
                            onClick={() => moveFolder(folder.id, target.id)}
                            style={{ paddingLeft: `${0.5 + targetDepth * 0.75}rem` }}
                          >
                            {target.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (
                          window.confirm(
                            `Delete "${folder.name}"? Subfolders will also be deleted, and all notes inside will become Unfiled.`
                          )
                        ) {
                          handleDeleteFolder(folder.id)
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ItemActions>
            )}
          </Item>
        </div>
      </div>
      {!isCollapsed && hasChildren && (
        <div className="flex flex-col gap-1">
          {subfolders.map((sub) => (
            <FileTreeNode key={sub.id} type="folder" folder={sub} depth={depth + 1} />
          ))}
          {childNotes.map((note) => (
            <FileTreeNode key={note.id} type="note" note={note} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteNode({ note, depth }: { note: NoteWithTags; depth: number }) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const {
    folders,
    tags,
    renamingNoteId,
    noteRenameValue,
    setNoteRenameValue,
    handleStartNoteRename,
    handleCommitNoteRename,
    handleCancelNoteRename,
    handleMoveNote,
    togglePin,
    addTagToNote,
    deleteNote,
    shareNote,
  } = useNotesContext()

  const isActive = activeNoteId === note.id
  const isRenaming = renamingNoteId === note.id

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `note-${note.id}`,
    data: { kind: 'note', id: note.id },
  })

  const open = () => {
    navigate(`/app/notes/${note.id}`)
  }

  const moveTargets = flattenFolders(folders)
  const availableTags = tags.filter((tag) => !note.tags.some((t) => t.id === tag.id))

  const handleCopyShareLink = async () => {
    const url = await shareNote(note.id)
    await navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard')
  }

  const handleDelete = async () => {
    await deleteNote(note.id)
    if (isActive) navigate('/app')
  }

  return (
    <div ref={setDragRef} className={cn(isDragging && 'opacity-40')}>
      <Item
        variant={isActive ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        aria-current={isActive || undefined}
        onClick={() => !isRenaming && open()}
        onKeyDown={onActivateKey(() => !isRenaming && open())}
        className={cn(
          'group cursor-pointer gap-2 border-l-2',
          isActive ? 'border-l-primary' : 'border-l-transparent'
        )}
        style={{ paddingLeft: `${0.75 + depth * INDENT_REM}rem` }}
      >
        <button
          type="button"
          aria-label="Drag to move"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing max-md:opacity-100"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="size-5 shrink-0" />
        <ItemMedia>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          {isRenaming ? (
            <input
              autoFocus
              value={noteRenameValue}
              onChange={(e) => setNoteRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => handleCommitNoteRename(note.id)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') handleCommitNoteRename(note.id)
                if (e.key === 'Escape') handleCancelNoteRename()
              }}
              placeholder="Untitled"
              className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
          )}
        </ItemContent>
        {note.tags.length > 0 && !isRenaming && (
          <div
            className="flex shrink-0 items-center gap-0.5"
            title={note.tags.map((tag) => `#${tag.name}`).join(', ')}
          >
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
        {!isRenaming && (
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
                <DropdownMenuItem onClick={open}>Open</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartNoteRename(note)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => togglePin(note.id, !note.pinned)}>
                  {note.pinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      Unpin note
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin note
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      disabled={note.folder_id === null}
                      onClick={() => handleMoveNote(note.id, null)}
                    >
                      Unfiled
                    </DropdownMenuItem>
                    {moveTargets.length > 0 && <DropdownMenuSeparator />}
                    {moveTargets.map(({ folder, depth: targetDepth }) => (
                      <DropdownMenuItem
                        key={folder.id}
                        disabled={note.folder_id === folder.id}
                        onClick={() => handleMoveNote(note.id, folder.id)}
                        style={{ paddingLeft: `${0.5 + targetDepth * 0.75}rem` }}
                      >
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <TagIcon className="mr-2 h-4 w-4" />
                    Add tag
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableTags.length === 0 ? (
                      <DropdownMenuItem disabled>No tags to add</DropdownMenuItem>
                    ) : (
                      availableTags.map((tag) => (
                        <DropdownMenuItem key={tag.id} onClick={() => addTagToNote(note.id, tag.name)}>
                          <span
                            className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color }}
                            aria-hidden="true"
                          />
                          #{tag.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handleCopyShareLink}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Copy share link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => {
                    if (window.confirm('Move this note to trash?')) {
                      handleDelete()
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        )}
      </Item>
    </div>
  )
}
