import { useState } from 'react'
import { NoteListHeader } from '@/components/notelist/NoteListHeader'
import { NoteListRow } from '@/components/notelist/NoteListRow'
import { SharedNoteRow } from '@/components/sidebar/SharedNoteRow'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useActiveTag } from '@/hooks/useActiveTag'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useRemoveSelfFromNote } from '@/hooks/useRemoveSelfFromNote'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useTags } from '@/hooks/useTags'
import { sortNotes } from '@/lib/notes'
import { cn } from '@/lib/utils'
import type { SortBy } from '@/types'
import { SortPopover } from '../sidebar/SortPopover'
import { NoteListSearch } from './NoteListSearch'

type NoteListPanelProps = {
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
  /** Controls the panel's display/visibility (e.g. hidden on mobile when a note is open). */
  className?: string
}

function matchesSearch(search: string, title: string, content: string) {
  if (!search.trim()) return true
  const needle = search.trim().toLowerCase()
  return title.toLowerCase().includes(needle) || content.toLowerCase().includes(needle)
}

/** Persistent desktop middle column: the active folder/view's notes, with a local search filter and sort. */
export function NoteListPanel({ sortBy, setSortBy, className }: NoteListPanelProps) {
  const [search, setSearch] = useState('')
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { data: tags = [] } = useTags()
  const { activeFolderId, isSharedWithMeActive, isAllNotesActive } = useActiveFolder()
  const { activeTagId, isUntaggedActive } = useActiveTag()
  const removeSelfFromNote = useRemoveSelfFromNote()

  if (activeTagId) {
    const activeTag = tags.find((tag) => tag.id === activeTagId)
    const visibleNotes = sortNotes(
      notes.filter(
        (note) =>
          (isUntaggedActive ? note.tags.length === 0 : note.tags.some((tag) => tag.id === activeTagId)) &&
          matchesSearch(search, note.title, note.content)
      ),
      sortBy
    )

    return (
      <div className={cn('h-full w-72 shrink-0 flex-col border-r border-border lg:w-80', className)}>
        <NoteListHeader
          title={isUntaggedActive ? 'Untagged' : activeTag ? `#${activeTag.name}` : 'Tag'}
          count={visibleNotes.length}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <div className="flex-1 overflow-y-auto">
          {visibleNotes.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No notes with this tag yet.</p>
          ) : (
            visibleNotes.map((note) => <NoteListRow key={note.id} note={note} />)
          )}
        </div>
      </div>
    )
  }

  if (isAllNotesActive) {
    const visibleNotes = sortNotes(
      notes.filter((note) => matchesSearch(search, note.title, note.content)),
      sortBy
    )

    return (
      <div className={cn('h-full w-72 shrink-0 flex-col border-r border-border lg:w-80', className)}>
        <div className="flex shrink-0 flex-col border-b border-border">
          <div className="flex items-center gap-2 p-3">
            <NoteListSearch value={search} onChange={setSearch} />
            <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="truncate text-xs font-medium text-muted-foreground">All notes</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {visibleNotes.length} note{visibleNotes.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {visibleNotes.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No notes here yet.</p>
          ) : (
            visibleNotes.map((note) => <NoteListRow key={note.id} note={note} />)
          )}
        </div>
      </div>
    )
  }

  if (isSharedWithMeActive) {
    const filteredShared = sharedNotes.filter((note) => matchesSearch(search, note.title, note.content))

    return (
      <div className={cn('h-full w-72 shrink-0 flex-col border-r border-border lg:w-80', className)}>
        <NoteListHeader
          title="Shared with me"
          count={filteredShared.length}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <div className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {filteredShared.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No shared notes yet.</p>
          ) : (
            filteredShared.map((note) => (
              <SharedNoteRow key={note.id} note={note} onRemove={(id) => removeSelfFromNote.mutate(id)} />
            ))
          )}
        </div>
      </div>
    )
  }

  const activeFolder = folders.find((folder) => folder.id === activeFolderId)
  const visibleNotes = sortNotes(
    notes.filter((note) => note.folder_id === activeFolderId && matchesSearch(search, note.title, note.content)),
    sortBy
  )

  return (
    <div className={cn('h-full w-72 shrink-0 flex-col border-r border-border lg:w-80', className)}>
      <NoteListHeader
        title={activeFolder?.name ?? 'Unfiled'}
        count={visibleNotes.length}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <div className="flex-1 overflow-y-auto">
        {visibleNotes.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No notes here yet.</p>
        ) : (
          visibleNotes.map((note) => <NoteListRow key={note.id} note={note} />)
        )}
      </div>
    </div>
  )
}
