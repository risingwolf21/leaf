import {
  useDroppable,
} from '@dnd-kit/core'
import { ChevronRight, Eye, MoreHorizontal, Pencil, UserX, X, Folder as FolderIcon, FileText } from 'lucide-react'
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
import type { Folder, NoteWithTags, SharedNote, Tag } from '@/types'
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '../ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

const UNFILED_DROPPABLE_ID = 'folder-drop-unfiled'

type FileTreeNodeNote = { type: 'note'; note: NoteWithTags; };

type TreeItem = FileTreeNodeNote | { type: 'folder'; folder: Folder; items: TreeItem[]; };

export function buildFileTree(folders: Folder[], notes: NoteWithTags[]): TreeItem[] {
  // 1. Map erstellen, um Ordner-Knoten schnell per ID zu finden
  const folderMap = new Map<string, { type: 'folder'; folder: Folder; items: TreeItem[] }>();

  // Das Array, das am Ende die Root-Elemente (ganz oben ohne Parent) enthält
  const rootItems: TreeItem[] = [];

  // 2. Alle Ordner in die Map eintragen und initialisieren
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      type: 'folder',
      folder: folder,
      items: []
    });
  });

  // 3. Ordner in die Hierarchie einfügen
  folders.forEach(folder => {
    const currentFolderNode = folderMap.get(folder.id)!;

    if (folder.parent_id === null) {
      // Wenn der Ordner kein Parent hat, liegt er auf der Root-Ebene
      rootItems.push(currentFolderNode);
    } else {
      // Wenn er ein Parent hat, weise ihn dem Parent-Ordner als Child zu
      const parentNode = folderMap.get(folder.parent_id);
      if (parentNode) {
        parentNode.items.push(currentFolderNode);
      } else {
        // Fallback: Falls die parent_id ins Leere läuft, auf Root-Ebene platzieren
        rootItems.push(currentFolderNode);
      }
    }
  });

  // 4. Notizen an die richtige Stelle im Baum einfügen
  notes.forEach(note => {
    const noteNode: FileTreeNodeNote = {
      type: 'note',
      note: note
    };

    if (note.folder_id === null) {
      // Notiz liegt lose im Hauptverzeichnis
      rootItems.push(noteNode);
    } else {
      // Notiz gehört in einen Ordner
      const parentFolderNode = folderMap.get(note.folder_id);
      if (parentFolderNode) {
        parentFolderNode.items.push(noteNode);
      } else {
        // Fallback: Falls der Ordner nicht existiert, ab auf die Root-Ebene
        rootItems.push(noteNode);
      }
    }
  });

  return rootItems;
}

export function getFolderAncestorChain(folderId: string | null, folders: Folder[]): string[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const chain: string[] = []

  let current = folderId
  while (current) {
    chain.push(current)
    current = byId.get(current)?.parent_id ?? null
  }

  return chain
}

export const FileTreeRoot = () => {
  const { notes, folders } =
    useNotesContext()

  const fileTree = buildFileTree(folders, notes);
  
  return <FileTree item={fileTree} />

}

export const FileTree = ({ item }: { item: TreeItem[] }) => {
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()

  return item.map((node) => {
    if (node.type === 'note') {
      return (
        <SidebarMenuButton
          key={node.note.id}
          isActive={activeNoteId === node.note.id}
          className="data-[active=true]:bg-transparent"
          onClick={() => navigate(`/app/notes/${node.note.id}`)}
        >
          <FileText />
          {node.note.title}
        </SidebarMenuButton>
      )
    }

    return <SidebarMenuItem key={node.folder.id}>
      <Collapsible className="group/collapsible">
        <CollapsibleTrigger
          render={(props, state) => (
            <SidebarMenuButton {...props}>
              <ChevronRight className={cn('transition-transform', state.open && 'rotate-90')} />
              <FolderIcon />
              {node.folder.name}
            </SidebarMenuButton>
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub>
            <FileTree item={node.items} />
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  })
}

/** Top-level sidebar tree: folders, unfiled notes, shared notes, and (when a tag filter is active) a flat filtered list. */
export function FileTree2() {
  const { notes, folders, sortBy, tagFilter, sharedNotes, removeSelfFromNote } =
    useNotesContext()

  if (tagFilter.size > 0) return <TagFilteredView />

  const rootFolders = folders.filter((folder) => folder.parent_id === null)
  const unfiledNotes = sortNotes(notes.filter((note) => note.folder_id === null), sortBy)
  const isEmpty = rootFolders.length === 0 && unfiledNotes.length === 0 && sharedNotes.length === 0

  return (
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
  const isActive = activeNoteId === note.id
  const RoleIcon = note.my_role === 'editor' ? Pencil : Eye
  const roleLabel = note.my_role === 'editor' ? 'Can edit' : 'Can view'

  const open = () => {
    navigate(`/app/notes/${note.id}`)
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
