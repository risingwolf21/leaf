import type { Folder } from '@/types'

/** Indentation step (in rem) for "move to folder" submenu items, scaled by depth. */
export const INDENT_REM = 1

/** Flattens the folder tree into a depth-first list with depth, for "move to folder" menus. */
export function flattenFolders(
  folders: Folder[],
  parentId: string | null = null,
  depth = 0
): { folder: Folder; depth: number }[] {
  return folders
    .filter((folder) => folder.parent_id === parentId)
    .flatMap((folder) => [
      { folder, depth },
      ...flattenFolders(folders, folder.id, depth + 1),
    ])
}

/** Joins a folder and its ancestors' names with " / ", or "Unfiled" if `folderId` is null/unknown. */
export function folderPath(folders: Folder[], folderId: string | null): string {
  const segments: string[] = []
  let current = folders.find((folder) => folder.id === folderId)
  while (current) {
    segments.unshift(current.name)
    const parentId = current.parent_id
    current = folders.find((folder) => folder.id === parentId)
  }
  return segments.length > 0 ? segments.join(' / ') : 'Unfiled'
}

/** Returns `folderId` plus every ancestor up to the root (via `parent_id`), or `[]` if `folderId` is null. */
export function getFolderAncestorChain(folderId: string | null, folders: Folder[]): string[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const chain: string[] = []

  let current = folderId
  while (current) {
    chain.push(current)
    current = byId.get(current)?.parent_id ?? null
  }

  return chain
}
