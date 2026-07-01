import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ALL_NOTES_FOLDER_ID, SHARED_WITH_ME_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { getFolderAncestorChain } from '@/lib/folderTree'

/**
 * The active real folder id (or `null` for unfiled/"All notes"), used as the
 * target folder for "new note", "new folder", and to filter the desktop
 * note-list panel. Derived from the open note's `folder_id` when a note is
 * open, otherwise from the `:folderId` route param (e.g. viewing a folder
 * without a note open yet) — virtual folder ids never resolve to a real
 * folder, since neither is a valid creation/filter target on their own.
 * Also returns the chain of ancestor folder ids for auto-expanding the
 * sidebar tree, and whether the "Shared with me" virtual folder is active.
 */
export function useActiveFolder() {
  const { noteId, folderId: routeFolderId } = useParams<{ noteId?: string; folderId?: string }>()
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()

  const isVirtualRoute = routeFolderId === ALL_NOTES_FOLDER_ID || routeFolderId === SHARED_WITH_ME_FOLDER_ID
  const routeFolderTarget = isVirtualRoute ? null : (routeFolderId ?? null)

  const activeFolderId = noteId
    ? (notes.find((note) => note.id === noteId)?.folder_id ?? null)
    : routeFolderTarget

  const autoExpandedFolderIds = useMemo(
    () => new Set(getFolderAncestorChain(activeFolderId, folders)),
    [activeFolderId, folders]
  )

  return {
    activeFolderId,
    autoExpandedFolderIds,
    isSharedWithMeActive: !noteId && routeFolderId === SHARED_WITH_ME_FOLDER_ID,
  }
}
