import { Eye, Folder as FolderIcon, MoreHorizontal, Pencil, Share2, UserX, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import {
  ALL_NOTES_FOLDER_ID,
  FolderNode,
  NoteNode,
  SHARED_WITH_ME_FOLDER_ID,
  VirtualFolderNode,
} from '@/components/sidebar/FileTreeNode'
import { useFolders } from '@/hooks/useFolders'
import { sortNotes, useNotes, type SortBy } from '@/hooks/useNotes'
import { useRemoveSelfFromNote, useSharedNotes } from '@/hooks/useSharedNotes'
import { useTags } from '@/hooks/useTags'
import { useTagFilter } from '@/lib/sidebarStore'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { cn, onActivateKey } from '@/lib/utils'
import type { SharedNote, Tag } from '@/types'

/** Top-level sidebar tree: folders, unfiled notes, shared notes, and (when a tag filter is active) a flat filtered list. */
export function FileTreeRoot({ sortBy }: { sortBy: SortBy }) {
  const { data: folders = [] } = useFolders()
  const { data: notes = [] } = useNotes()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { tagFilter } = useTagFilter()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const removeSelfFromNote = useRemoveSelfFromNote()

  if (tagFilter.size > 0) return <TagFilteredView sortBy={sortBy} />

  const rootFolders = folders.filter((folder) => folder.parent_id === null)
  const unfiledNotes = sortNotes(notes.filter((note) => note.folder_id === null), sortBy)
  const isEmpty = rootFolders.length === 0 && unfiledNotes.length === 0 && sharedNotes.length === 0

  return (
    <div className="flex flex-col gap-0.5">
      {unfiledNotes.length > 0 && (
        <VirtualFolderNode
          id={ALL_NOTES_FOLDER_ID}
          label="All notes"
          icon={<FolderIcon />}
          forceOpen={unfiledNotes.some((note) => note.id === activeNoteId)}
        >
          {unfiledNotes.map((note) => (
            <NoteNode key={note.id} note={note} />
          ))}
        </VirtualFolderNode>
      )}

      {sharedNotes.length > 0 && (
        <VirtualFolderNode
          id={SHARED_WITH_ME_FOLDER_ID}
          label="Shared with me"
          icon={<Share2 />}
          forceOpen={sharedNotes.some((note) => note.id === activeNoteId)}
        >
          {sharedNotes.map((note) => (
            <SidebarMenuItem key={note.id}>
              <SharedNoteRow note={note} onRemove={(id) => removeSelfFromNote.mutate(id)} />
            </SidebarMenuItem>
          ))}
        </VirtualFolderNode>
      )}

      {rootFolders.map((folder) => (
        <FolderNode key={folder.id} folder={folder} sortBy={sortBy} />
      ))}

      {isEmpty && (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          No notes yet. Create your first note to get started.
        </p>
      )}
    </div>
  )
}

/** Flat, filtered note list shown in Files mode when a tag (or "Untagged") filter is active. */
function TagFilteredView({ sortBy }: { sortBy: SortBy }) {
  const { data: notes = [] } = useNotes()
  const { data: tags = [] } = useTags()
  const { tagFilter, toggleTagFilter } = useTagFilter()

  const filtered = tagFilter.has(UNTAGGED_FILTER_ID)
    ? notes.filter((note) => note.tags.length === 0)
    : notes.filter((note) => [...tagFilter].every((tagId) => note.tags.some((tag) => tag.id === tagId)))

  const sorted = sortNotes(filtered, sortBy)

  return (
    <div className="flex flex-col gap-0.5">
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
        sorted.map((note) => <NoteNode key={note.id} note={note} />)
      )}
    </div>
  )
}

function FilterChip({ label, tag, onRemove }: { label?: string; tag?: Tag; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
      {tag && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden="true" />
      )}
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

/** A note shared with the current user by another owner, shown below the file tree. */
function SharedNoteRow({ note, onRemove }: { note: SharedNote; onRemove: (id: string) => void }) {
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const isActive = activeNoteId === note.id
  const RoleIcon = note.my_role === 'editor' ? Pencil : Eye
  const roleLabel = note.my_role === 'editor' ? 'Can edit' : 'Can view'

  const open = () => {
    navigate(`/app/notes/${note.id}`)
    setOpenMobile(false)
  }

  const handleRemove = () => {
    if (window.confirm('Remove this note from your shared notes?')) {
      onRemove(note.id)
      if (isActive) navigate('/app')
    }
  }

  return (
    <Item
      size="sm"
      role="button"
      tabIndex={0}
      aria-current={isActive || undefined}
      onClick={open}
      onKeyDown={onActivateKey(open)}
      className={cn('group cursor-pointer gap-2', isActive && 'bg-primary text-primary-foreground')}
    >
      <span className="size-5 shrink-0" />
      <ItemContent>
        <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
        <ItemDescription className="flex items-center gap-1">
          <span title={roleLabel} className="shrink-0">
            <RoleIcon className={cn("size-3", isActive && 'bg-primary text-primary-foreground')} aria-hidden="true" />
          </span>
          <span className={cn("truncate", isActive && 'bg-primary text-primary-foreground')}>{note.owner_email}</span>
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
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove from shared
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item >
  )
}
