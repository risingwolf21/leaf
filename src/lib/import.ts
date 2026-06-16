const SKIP_FOLDERS = new Set(['Recently Deleted'])
const MEDIA_DIRS = new Set(['images', 'attachments'])

export type ImportNote = { file: File; folderName: string | null }

export type ClassifiedFiles = {
  notes: ImportNote[]
  images: Map<string, File>   // basename (e.g. UUID.png) → File
  folderNames: Set<string>
}

/**
 * Classifies files from a webkitdirectory folder picker into notes and
 * images. The first path segment (the root directory the user selected)
 * is stripped; Apple's "Recently Deleted" folder is skipped.
 *
 * Expected structure after stripping root:
 *   FolderName/note.md           → note in FolderName
 *   FolderName/images/UUID.png  → image belonging to FolderName
 */
export function classifyFiles(files: File[]): ClassifiedFiles {
  const notes: ImportNote[] = []
  const images = new Map<string, File>()
  const folderNames = new Set<string>()

  for (const file of files) {
    const parts = file.webkitRelativePath.split('/')
    const rel = parts.slice(1)           // strip the root directory the user selected
    if (rel.length === 0) continue

    const filename = rel[rel.length - 1]
    const folderName = rel.length >= 2 ? rel[0] : null
    if (folderName && SKIP_FOLDERS.has(folderName)) continue

    const parentDir = rel.length >= 2 ? rel[rel.length - 2] : null

    if (/\.(md|markdown)$/i.test(filename)) {
      notes.push({ file, folderName })
      if (folderName) folderNames.add(folderName)
    } else if (/\.(png|jpe?g|gif|webp)$/i.test(filename) && parentDir && MEDIA_DIRS.has(parentDir)) {
      images.set(filename, file)
    }
  }

  return { notes, images, folderNames }
}

/** Rewrites local image paths in markdown content with their uploaded URLs. */
export function replaceImageRefs(content: string, imageUrlMap: Map<string, string>): string {
  let result = content
  for (const [filename, url] of imageUrlMap) {
    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(
      new RegExp(`!\\[([^\\]]*)\\]\\([^)]*${escaped}\\)`, 'g'),
      (_, alt: string) => `![${alt}](${url})`
    )
  }
  return result
}
