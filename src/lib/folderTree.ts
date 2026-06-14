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
