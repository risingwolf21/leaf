import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { NoteListHeader } from '@/components/notelist/NoteListHeader'
import { NoteListRow } from '@/components/notelist/NoteListRow'
import { SharedNoteRow } from '@/components/sidebar/SharedNoteRow'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useRemoveSelfFromNote } from '@/hooks/useRemoveSelfFromNote'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { sortNotes } from '@/lib/notes'
import { cn } from '@/lib/utils'
import type { SortBy } from '@/types'

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
  const { noteId } = useParams<{ noteId?: string }>()
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()
  const { data: sharedNotes = [] } = useSharedNotes()
  const { activeFolderId, isSharedWithMeActive, isAllNotesActive } = useActiveFolder()
  const removeSelfFromNote = useRemoveSelfFromNote()

  const isSharedNoteOpen =
    !!noteId && !notes.some((note) => note.id === noteId) && sharedNotes.some((note) => note.id === noteId)

  if (isAllNotesActive) {
    const visibleNotes = sortNotes(
      notes.filter((note) => matchesSearch(search, note.title, note.content)),
      sortBy
    )

    return (
      <div className={cn('h-full w-72 shrink-0 flex-col border-r border-border lg:w-80', className)}>
        <NoteListHeader
          title="All Notes"
          count={visibleNotes.length}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
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

  if (isSharedWithMeActive || isSharedNoteOpen) {
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
