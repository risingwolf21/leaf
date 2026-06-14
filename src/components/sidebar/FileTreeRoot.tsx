import { Folder as FolderIcon, Share2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { SidebarMenuItem } from '@/components/ui/sidebar'
import { FolderNode } from '@/components/sidebar/FolderNode'
import { NoteNode } from '@/components/sidebar/NoteNode'
import { SharedNoteRow } from '@/components/sidebar/SharedNoteRow'
import { TagFilteredView } from '@/components/sidebar/TagFilteredView'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID, VirtualFolderNode } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useRemoveSelfFromNote } from '@/hooks/useRemoveSelfFromNote'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { sortNotes } from '@/lib/notes'
import { useTagFilter } from '@/lib/sidebarStore'
import type { SortBy } from '@/types'

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
