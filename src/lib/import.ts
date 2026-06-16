const SKIP_FOLDERS = new Set(['Recently Deleted'])
const MEDIA_DIRS = new Set(['images', 'attachments'])

export type FileEntry = { file: File; relativePath: string }
export type ImportNote = { file: File; folderName: string | null }
export type ImportImage = { file: File; folderName: string | null }

export type ClassifiedFiles = {
  notes: ImportNote[]
  images: Map<string, ImportImage>  // basename (e.g. UUID.png) → ImportImage
  folderNames: Set<string>
}

/** Converts a File[] from <input webkitdirectory> into FileEntry[]. */
export function filesToEntries(files: File[]): FileEntry[] {
  return files.map((f) => ({ file: f, relativePath: f.webkitRelativePath || f.name }))
}

async function readEntry(entry: FileSystemEntry): Promise<FileEntry[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      ;(entry as FileSystemFileEntry).file(resolve, reject)
    })
    return [{ file, relativePath: entry.fullPath.replace(/^\//, '') }]
  }

  const reader = (entry as FileSystemDirectoryEntry).createReader()
  const all: FileSystemEntry[] = []

  // readEntries returns at most 100 at a time; loop until the batch is empty.
  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })
    if (batch.length === 0) break
    all.push(...batch)
  }

  const nested = await Promise.all(all.map(readEntry))
  return nested.flat()
}

/** Traverses all dragged items (files or folders) via the FileSystem Entry API. */
export async function readDroppedItems(dataTransfer: DataTransfer): Promise<FileEntry[]> {
  const entries = Array.from(dataTransfer.items)
    .map((item) => item.webkitGetAsEntry())
    .filter((e): e is FileSystemEntry => e !== null)

  const results = await Promise.all(entries.map(readEntry))
  return results.flat()
}

/**
 * Classifies FileEntry[] into notes and images.
 * Strips the root directory segment, skips "Recently Deleted".
 *
 * Expected structure after stripping root:
 *   FolderName/note.md          → note in FolderName
 *   FolderName/images/UUID.png  → image belonging to FolderName
 */
export function classifyFiles(entries: FileEntry[]): ClassifiedFiles {
  const notes: ImportNote[] = []
  const images = new Map<string, ImportImage>()
  const folderNames = new Set<string>()

  for (const { file, relativePath } of entries) {
    const parts = relativePath.split('/')
    const rel = parts.slice(1)  // strip the root directory the user selected
    if (rel.length === 0) continue

    const filename = rel[rel.length - 1]
    const folderName = rel.length >= 2 ? rel[0] : null
    if (folderName && SKIP_FOLDERS.has(folderName)) continue

    const parentDir = rel.length >= 2 ? rel[rel.length - 2] : null

    if (/\.(md|markdown)$/i.test(filename)) {
      notes.push({ file, folderName })
      if (folderName) folderNames.add(folderName)
    } else if (/\.(png|jpe?g|gif|webp)$/i.test(filename) && parentDir && MEDIA_DIRS.has(parentDir)) {
      images.set(filename, { file, folderName })
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
