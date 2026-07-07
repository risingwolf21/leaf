import { useParams } from 'react-router-dom'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID, UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'

/**
 * The active real folder id (or `null` for unfiled/"All Notes"), used as the
 * target folder for "new note", "new folder", and to filter the desktop
 * note-list panel. A note's URL always nests it under its real folder context
 * (see `notePath()`), so the `:folderId` route param alone is enough — virtual
 * folder ids never resolve to a real folder, since none is a valid
 * creation/filter target on their own. Also returns whether "Shared with me"
 * or "All Notes" is active.
 */
export function useActiveFolder() {
  const { folderId: routeFolderId } = useParams<{ folderId?: string }>()

  const isVirtualRoute =
    routeFolderId === UNFILED_FOLDER_ID ||
    routeFolderId === SHARED_WITH_ME_FOLDER_ID ||
    routeFolderId === ALL_NOTES_FOLDER_ID
  const activeFolderId = isVirtualRoute ? null : (routeFolderId ?? null)

  return {
    activeFolderId,
    isSharedWithMeActive: routeFolderId === SHARED_WITH_ME_FOLDER_ID,
    isAllNotesActive: routeFolderId === ALL_NOTES_FOLDER_ID,
  }
}
