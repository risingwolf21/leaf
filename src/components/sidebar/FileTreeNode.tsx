import { useEffect, useState } from 'react'
import {
  ChevronRight,
  FilePlus,
  FileText,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  History,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useCollapsedFolders } from '@/hooks/useCollapsedFolders'
import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useMoveFolder,
  useMoveNote,
  useRenameFolder,
} from '@/hooks/useFolders'
import {
  sortNotes,
  useCreateNote,
  useDeleteNote,
  useNotes,
  useShareNote,
  useTogglePin,
  useUpdateNote,
  type SortBy,
} from '@/hooks/useNotes'
import { useAddTagToNote, useTags } from '@/hooks/useTags'
import { usePendingRename, useVersionHistorySheet } from '@/lib/sidebarStore'
import { cn } from '@/lib/utils'
import type { Folder, NoteWithTags } from '@/types'

/** Indentation step (in rem) for "move to folder" submenu items, scaled by depth. */
export const INDENT_REM = 1

const RENAME_INPUT_CLASS =
  'min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'

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

/** Renders a folder row, recursively rendering its subfolders and notes when expanded. */
export function FolderNode({ folder, sortBy }: { folder: Folder; sortBy: SortBy }) {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const { autoExpandedFolderIds } = useActiveFolder()
  const { collapsedFolderIds, toggleFolderCollapsed } = useCollapsedFolders()
  const { pendingRename, setPendingRename } = usePendingRename()
  const renameFolder = useRenameFolder()
  const deleteFolder = useDeleteFolder()
  const createFolder = useCreateFolder()
  const createNote = useCreateNote()
  const moveFolder = useMoveFolder()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(folder.name)

  useEffect(() => {
    if (pendingRename?.kind === 'folder' && pendingRename.id === folder.id) {
      setRenameValue(folder.name)
      setIsRenaming(true)
      setPendingRename(null)
    }
  }, [pendingRename, folder.id, folder.name, setPendingRename])

  const subfolders = folders.filter((item) => item.parent_id === folder.id)
  const childNotes = sortNotes(notes.filter((note) => note.folder_id === folder.id), sortBy)
  const hasChildren = subfolders.length > 0 || childNotes.length > 0
  const isOpen = autoExpandedFolderIds.has(folder.id) || !collapsedFolderIds.has(folder.id)
  const moveTargets = flattenFolders(folders).filter(({ folder: target }) => target.id !== folder.id)

  const startRename = () => {
    setRenameValue(folder.name)
    setIsRenaming(true)
  }

  const commitRename = () => {
    setIsRenaming(false)
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== folder.name) renameFolder.mutate({ id: folder.id, name: trimmed })
  }

  const cancelRename = () => setIsRenaming(false)

  const handleNewNoteInside = () => {
    createNote.mutate({ folderId: folder.id }, { onSuccess: (note) => navigate(`/app/notes/${note.id}`) })
  }

  const handleNewSubfolder = () => {
    createFolder.mutate(
      { name: 'New folder', parentId: folder.id },
      { onSuccess: (created) => setPendingRename({ kind: 'folder', id: created.id }) }
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${folder.name}"? Subfolders will also be deleted, and all notes inside will become Unfiled.`
      )
    ) {
      deleteFolder.mutate(folder.id)
    }
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={() => toggleFolderCollapsed(folder.id)} className="group/collapsible">
        <CollapsibleTrigger
          render={(triggerProps, state) => (
            <SidebarMenuButton
              {...triggerProps}
            >
              {hasChildren ? (
                <ChevronRight className={cn('transition-transform', state.open && 'rotate-90')} />
              ) : (
                <span className="size-4 shrink-0" />
              )}
              <FolderIcon />
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') cancelRename()
                  }}
                  className={RENAME_INPUT_CLASS}
                />
              ) : (
                <span className="truncate">{folder.name}</span>
              )}
            </SidebarMenuButton>
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub className={"pr-0 mr-0"}>
            {subfolders.map((sub) => (
              <FolderNode key={sub.id} folder={sub} sortBy={sortBy} />
            ))}
            {childNotes.map((note) => (
              <NoteNode key={note.id} note={note} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction showOnHover aria-label="Folder actions">
                <MoreHorizontal />
              </SidebarMenuAction>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleNewNoteInside}>
              <FilePlus className="mr-2 h-4 w-4" />
              New note inside
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewSubfolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={startRename}>
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
                  onClick={() => moveFolder.mutate({ folderId: folder.id, newParentId: null })}
                >
                  Root (no parent)
                </DropdownMenuItem>
                {moveTargets.length > 0 && <DropdownMenuSeparator />}
                {moveTargets.map(({ folder: target, depth }) => (
                  <DropdownMenuItem
                    key={target.id}
                    disabled={folder.parent_id === target.id}
                    onClick={() => moveFolder.mutate({ folderId: folder.id, newParentId: target.id })}
                    style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
                  >
                    {target.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  )
}

/** Renders a single note row with rename, pin, move, tag, share, and delete actions. */
export function NoteNode({ note }: { note: NoteWithTags }) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { data: folders = [] } = useFolders()
  const { data: tags = [] } = useTags()
  const { pendingRename, setPendingRename } = usePendingRename()
  const { openVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()
  const moveNote = useMoveNote()
  const togglePin = useTogglePin()
  const addTagToNote = useAddTagToNote()
  const deleteNote = useDeleteNote()
  const shareNote = useShareNote()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(note.title)

  useEffect(() => {
    if (pendingRename?.kind === 'note' && pendingRename.id === note.id) {
      setRenameValue(note.title)
      setIsRenaming(true)
      setPendingRename(null)
    }
  }, [pendingRename, note.id, note.title, setPendingRename])

  const isActive = activeNoteId === note.id
  const moveTargets = flattenFolders(folders)
  const availableTags = tags.filter((tag) => !note.tags.some((t) => t.id === tag.id))

  const open = () => navigate(`/app/notes/${note.id}`)

  const startRename = () => {
    setRenameValue(note.title)
    setIsRenaming(true)
  }

  const commitRename = () => {
    setIsRenaming(false)
    updateNote(note.id, { title: renameValue.trim() })
  }

  const cancelRename = () => setIsRenaming(false)

  const handleCopyShareLink = () => {
    shareNote.mutate(note.id, {
      onSuccess: ({ url }) => {
        navigator.clipboard.writeText(url)
        toast.success('Share link copied to clipboard')
      },
    })
  }

  const handleDelete = () => {
    deleteNote.mutate(note.id)
    if (isActive) navigate('/app')
  }

  return (
    <SidebarMenuItem >
      <SidebarMenuButton
        isActive={isActive}
        className="data-[active=true]:bg-transparent"
        render={isRenaming ? <div /> : undefined}
        onClick={isRenaming ? undefined : open}
      >
        <span className="size-4 shrink-0" />
        <FileText />
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') cancelRename()
            }}
            placeholder="Untitled"
            className={RENAME_INPUT_CLASS}
          />
        ) : (
          <span className="truncate">{note.title || 'Untitled'}</span>
        )}
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
      </SidebarMenuButton>
      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuAction showOnHover aria-label="Note actions">
                <MoreHorizontal />
              </SidebarMenuAction>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={open}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={startRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => togglePin.mutate({ id: note.id, pinned: !note.pinned })}>
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
                  onClick={() => moveNote.mutate({ noteId: note.id, folderId: null })}
                >
                  Unfiled
                </DropdownMenuItem>
                {moveTargets.length > 0 && <DropdownMenuSeparator />}
                {moveTargets.map(({ folder, depth }) => (
                  <DropdownMenuItem
                    key={folder.id}
                    disabled={note.folder_id === folder.id}
                    onClick={() => moveNote.mutate({ noteId: note.id, folderId: folder.id })}
                    style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
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
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => addTagToNote.mutate({ noteId: note.id, tagName: tag.name })}
                    >
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
            <DropdownMenuItem onClick={() => openVersionHistory(note)}>
              <History className="mr-2 h-4 w-4" />
              Version history
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyShareLink}>
              <Share2 className="mr-2 h-4 w-4" />
              Copy share link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (window.confirm('Move this note to trash?')) handleDelete()
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Move to trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  )
}
