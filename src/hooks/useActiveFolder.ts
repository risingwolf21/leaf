import { useParams } from 'react-router-dom'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID, UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useNotes } from '@/hooks/useNotes'

/**
 * The active real folder id (or `null` for unfiled/"All Notes"), used as the
 * target folder for "new note", "new folder", and to filter the desktop
 * note-list panel. Derived from the open note's `folder_id` when a note is
 * open, otherwise from the `:folderId` route param (e.g. viewing a folder
 * without a note open yet) — virtual folder ids never resolve to a real
 * folder, since none is a valid creation/filter target on their own.
 * Also returns whether "Shared with me" or "All Notes" is active.
 */
export function useActiveFolder() {
  const { noteId, folderId: routeFolderId } = useParams<{ noteId?: string; folderId?: string }>()
  const { data: notes = [] } = useNotes()

  const isVirtualRoute =
    routeFolderId === UNFILED_FOLDER_ID ||
    routeFolderId === SHARED_WITH_ME_FOLDER_ID ||
    routeFolderId === ALL_NOTES_FOLDER_ID
  const routeFolderTarget = isVirtualRoute ? null : (routeFolderId ?? null)

  const activeFolderId = noteId
    ? (notes.find((note) => note.id === noteId)?.folder_id ?? null)
    : routeFolderTarget

  return {
    activeFolderId,
    isSharedWithMeActive: !noteId && routeFolderId === SHARED_WITH_ME_FOLDER_ID,
    isAllNotesActive: !noteId && routeFolderId === ALL_NOTES_FOLDER_ID,
  }
}
