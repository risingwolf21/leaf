import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { getFolderAncestorChain } from '@/lib/folderTree'

/**
 * The open note's `folder_id` (or `null` if unfiled / no note open), used as
 * the target folder for "new note", "new folder", etc. Also returns the
 * chain of ancestor folder ids for auto-expanding the sidebar tree.
 */
export function useActiveFolder() {
  const { noteId } = useParams<{ noteId?: string }>()
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()

  const activeFolderId = notes.find((note) => note.id === noteId)?.folder_id ?? null
  const autoExpandedFolderIds = useMemo(
    () => new Set(getFolderAncestorChain(activeFolderId, folders)),
    [activeFolderId, folders]
  )

  return { activeFolderId, autoExpandedFolderIds }
}
