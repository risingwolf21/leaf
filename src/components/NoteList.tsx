import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowUpDown,
  ChevronRight,
  Eye,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  HelpCircle,
  History,
  LayoutTemplate,
  Moon,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Search,
  Sun,
  Trash2,
  UserX,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { TemplatePicker } from '@/components/TemplatePicker'
import { useNotesContext } from '@/context/NotesContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { MIN_QUERY_LENGTH, useSearch } from '@/hooks/useSearch'
import { useTheme } from '@/hooks/useTheme'
import { cn, formatRelativeTime, onActivateKey } from '@/lib/utils'
import type { SortBy } from '@/hooks/useNotes'
import type { AnyTemplate, Folder as FolderType, Note, SharedNote } from '@/types'

/** Returns up to `maxLength` characters of `content`, centred on the first match of `query`. */
function getSnippet(content: string, query: string, maxLength = 120) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const matchIndex = normalized.toLowerCase().indexOf(query.toLowerCase())
  if (matchIndex === -1) {
    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength).trimEnd()}…`
      : normalized
  }

  const matchCenter = matchIndex + query.length / 2
  let start = Math.max(0, Math.round(matchCenter - maxLength / 2))
  const end = Math.min(normalized.length, start + maxLength)
  start = Math.max(0, end - maxLength)

  let snippet = normalized.slice(start, end)
  if (start > 0) snippet = `…${snippet.trimStart()}`
  if (end < normalized.length) snippet = `${snippet.trimEnd()}…`
  return snippet
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

export function NoteList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { noteId } = useParams<{ noteId: string }>()
  const {
    notes,
    sharedNotes,
    folders,
    templates,
    loading,
    trashedNotes,
    selectedFolderId,
    setSelectedFolderId,
    sortBy,
    setSortBy,
    createNote,
    createNoteFromTemplate,
    deleteNote,
    togglePin,
    handleMoveNote,
    handleCreateFolder,
    handleDeleteFolder,
    openVersionHistory,
    removeSelfFromNote,
    renamingFolderId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
  } = useNotesContext()

  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { query, setQuery, results, isSearching } = useSearch()
  const { theme, toggleTheme } = useTheme()

  const activeNoteId = noteId ?? null
  const showTrash = location.pathname === '/app/trash'
  const showTemplates = location.pathname === '/app/templates'
  const trashCount = trashedNotes.length

  const trimmedQuery = query.trim()
  const showResults = trimmedQuery.length > 0

  const handleSelectNote = (note: Note) => navigate(`/app/notes/${note.id}`)

  const handleSelectResult = (note: Note) => {
    handleSelectNote(note)
    setQuery('')
  }

  const handleCreateNote = async () => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNote(folderId)
    if (note) navigate(`/app/notes/${note.id}`)
  }

  const handleSelectTemplate = async (template: AnyTemplate) => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNoteFromTemplate(template, folderId)
    if (note) navigate(`/app/notes/${note.id}`)
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
    if (activeNoteId === id) navigate('/app')
  }

  const handleRemoveSharedNote = async (id: string) => {
    await removeSelfFromNote(id)
    if (activeNoteId === id) navigate('/app')
  }

  // Direct subfolders of the current navigation level (mobile/tablet drill-down only;
  // on desktop, folder navigation lives in the FolderTree sidebar).
  const childFolders = useMemo(() => {
    const parentId = selectedFolderId === 'all' ? null : selectedFolderId
    return folders.filter((folder) => folder.parent_id === parentId)
  }, [folders, selectedFolderId])

  // "All Notes" is a recursive smart view of every note; a real folder shows only its direct notes.
  const scopedNotes = useMemo(
    () =>
      selectedFolderId === 'all'
        ? notes
        : notes.filter((note) => note.folder_id === selectedFolderId),
    [notes, selectedFolderId]
  )

  const pinnedNotes = useMemo(() => scopedNotes.filter((note) => note.pinned), [scopedNotes])
  const unpinnedNotes = useMemo(() => scopedNotes.filter((note) => !note.pinned), [scopedNotes])

  // Shared notes aren't part of any folder, so the section only appears in "All Notes".
  const showSharedSection = selectedFolderId === 'all' && sharedNotes.length > 0

  const moveTargets = useMemo(() => flattenFolders(folders), [folders])

  const renderNoteItem = (note: Note) => {
    const folderTag =
      selectedFolderId === 'all'
        ? (note.folder_id && folders.find((folder) => folder.id === note.folder_id)?.name) || 'Unfiled'
        : null
    const select = () => handleSelectNote(note)

    return (
      <Item
        key={note.id}
        variant={activeNoteId === note.id ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        aria-current={activeNoteId === note.id || undefined}
        onClick={select}
        onKeyDown={onActivateKey(select)}
        className="group cursor-pointer gap-2"
      >
        <ItemContent>
          <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
          <ItemDescription>
            {folderTag ? `${folderTag} · ` : ''}
            Edited {formatRelativeTime(note.updated_at)}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Note actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                  {moveTargets.map(({ folder, depth }) => (
                    <DropdownMenuItem
                      key={folder.id}
                      disabled={note.folder_id === folder.id}
                      onClick={() => handleMoveNote(note.id, folder.id)}
                      style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => setTimeout(() => openVersionHistory(note), 0)}>
                <History className="mr-2 h-4 w-4" />
                Version history
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => {
                  if (window.confirm('Delete this note? This cannot be undone.')) {
                    handleDeleteNote(note.id)
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      </Item>
    )
  }

  const renderSharedNoteItem = (note: SharedNote) => {
    const RoleIcon = note.my_role === 'editor' ? Pencil : Eye
    const roleLabel = note.my_role === 'editor' ? 'Can edit' : 'Can view'
    const select = () => handleSelectNote(note)

    return (
      <Item
        key={note.id}
        variant={activeNoteId === note.id ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        aria-current={activeNoteId === note.id || undefined}
        onClick={select}
        onKeyDown={onActivateKey(select)}
        className="group cursor-pointer gap-2"
      >
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
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Note actions"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => {
                  if (window.confirm('Remove this note from your shared notes?')) {
                    handleRemoveSharedNote(note.id)
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

  const renderFolderItem = (folder: FolderType) => {
    const isRenaming = renamingFolderId === folder.id
    const navigateToFolder = () => setSelectedFolderId(folder.id)

    return (
      <Item
        key={folder.id}
        size="sm"
        role="button"
        tabIndex={0}
        onClick={() => !isRenaming && navigateToFolder()}
        onKeyDown={onActivateKey(() => !isRenaming && navigateToFolder())}
        className="group cursor-pointer gap-2"
      >
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
          <ItemActions>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Folder actions"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartRename(folder)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
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
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </ItemActions>
        )}
      </Item>
    )
  }

  const renderResult = (note: Note) => {
    const folderName = note.folder_id
      ? folders.find((folder) => folder.id === note.folder_id)?.name ?? 'Unfiled'
      : 'Unfiled'
    const select = () => handleSelectResult(note)

    return (
      <Item
        key={note.id}
        variant={activeNoteId === note.id ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        onClick={select}
        onKeyDown={onActivateKey(select)}
        className="cursor-pointer gap-2"
      >
        <ItemContent>
          <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
          <ItemDescription>
            {folderName} · {getSnippet(note.content, trimmedQuery)}
          </ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  const isEmpty = isDesktop
    ? scopedNotes.length === 0 && !showSharedSection
    : childFolders.length === 0 && scopedNotes.length === 0 && !showSharedSection

  const emptyMessage =
    selectedFolderId === 'all' ? 'No notes yet. Create your first note to get started.' : 'This folder is empty.'

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div className="flex gap-2">
          <TemplatePicker
            templates={templates}
            onCreateBlank={handleCreateNote}
            onSelectTemplate={handleSelectTemplate}
          />
          <Button onClick={handleCreateFolder} variant="outline" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Sort notes" className="shrink-0">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortBy)}
              >
                <DropdownMenuRadioItem value="updated_at">Last updated</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title_asc">Title A–Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title_desc">Title Z–A</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_at">Date created</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {showResults ? (
          trimmedQuery.length < MIN_QUERY_LENGTH ? (
            <p className="p-4 text-sm text-muted-foreground">Keep typing to search…</p>
          ) : isSearching && results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notes found</p>
          ) : (
            <ItemGroup className="gap-1 p-2">{results.map(renderResult)}</ItemGroup>
          )
        ) : loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading notes…</p>
        ) : isEmpty ? (
          <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ItemGroup className="gap-1 p-2">
            {!isDesktop && childFolders.map(renderFolderItem)}
            {pinnedNotes.length > 0 && (
              <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pinned
              </div>
            )}
            {pinnedNotes.map(renderNoteItem)}
            {unpinnedNotes.map(renderNoteItem)}
            {showSharedSection && (
              <>
                <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Shared with me
                </div>
                {sharedNotes.map(renderSharedNoteItem)}
              </>
            )}
          </ItemGroup>
        )}
      </ScrollArea>

      <div className="flex shrink-0 items-stretch border-t border-border pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => navigate('/app/templates')}
          className={cn(
            'flex flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent',
            showTemplates ? 'bg-accent text-foreground' : 'text-muted-foreground'
          )}
        >
          <LayoutTemplate className="h-4 w-4" />
          <span className="flex-1">Templates</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/app/trash')}
          className={cn(
            'flex flex-1 items-center gap-2 border-l border-border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent',
            showTrash ? 'bg-accent text-foreground' : 'text-muted-foreground'
          )}
        >
          <Trash2 className="h-4 w-4" />
          <span className="flex-1">Trash</span>
          {trashCount > 0 && <Badge variant="secondary">{trashCount}</Badge>}
        </button>
        <Link
          to="/help"
          aria-label="Markdown guide"
          title="Markdown guide"
          className="flex shrink-0 items-center justify-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex shrink-0 items-center justify-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
