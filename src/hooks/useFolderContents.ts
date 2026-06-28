import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { sortNotes } from '@/lib/notes'
import type { Folder, Note, SortBy } from '@/types'

export type FolderContents = {
  subfolders: Folder[]
  notes: Note[]
  isVirtual: boolean
  isLoading: boolean
}

/** Direct subfolders + notes for `folderId` (`null` = root), including the "All notes"/"Shared with me" virtual folders. */
export function useFolderContents(folderId: string | null, sortBy: SortBy): FolderContents {
  const { data: folders = [], isLoading: isFoldersLoading } = useFolders()
  const { data: notes = [], isLoading: isNotesLoading } = useNotes()
  const { data: sharedNotes = [], isLoading: isSharedLoading } = useSharedNotes()
  const isLoading = isFoldersLoading || isNotesLoading || isSharedLoading

  if (folderId === ALL_NOTES_FOLDER_ID) {
    return {
      subfolders: [],
      notes: sortNotes(notes.filter((note) => note.folder_id === null), sortBy),
      isVirtual: true,
      isLoading,
    }
  }

  if (folderId === SHARED_WITH_ME_FOLDER_ID) {
    return { subfolders: [], notes: sharedNotes, isVirtual: true, isLoading }
  }

  return {
    subfolders: folders.filter((folder) => folder.parent_id === folderId),
    notes: folderId === null ? [] : sortNotes(notes.filter((note) => note.folder_id === folderId), sortBy),
    isVirtual: false,
    isLoading,
  }
}
