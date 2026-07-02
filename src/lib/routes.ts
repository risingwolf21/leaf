import { SHARED_WITH_ME_FOLDER_ID, UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'

/**
 * Builds a note's URL, always nesting it under its real folder context (or the
 * Unfiled/Shared-with-me sentinel) — never the cross-folder "All Notes" sentinel —
 * so the URL is deterministic regardless of which nav item was used to reach it.
 */
export function notePath(noteId: string, folderId: string | null, isShared = false): string {
  if (isShared) return `/app/folders/${SHARED_WITH_ME_FOLDER_ID}/notes/${noteId}`
  return `/app/folders/${folderId ?? UNFILED_FOLDER_ID}/notes/${noteId}`
}

/** Builds a note's URL when reached from a tag's filtered list, keeping that list visible beside it. */
export function tagNotePath(noteId: string, tagId: string): string {
  return `/app/tags/${tagId}/notes/${noteId}`
}
