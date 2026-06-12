import JSZip from 'jszip'
import type { Folder, Note } from '@/types'

/** Joins a folder and its ancestors' names with "/", or "" if the note is unfiled. */
function folderPath(folders: Folder[], folderId: string | null): string {
  const segments: string[] = []
  let current = folders.find((folder) => folder.id === folderId)
  while (current) {
    segments.unshift(current.name)
    current = folders.find((folder) => folder.id === current!.parent_id)
  }
  return segments.join('/')
}

/** Strips characters that aren't safe in filenames on common filesystems. */
function sanitizeFilename(name: string): string {
  return (name.trim() || 'Untitled').replace(/[\\/:*?"<>|]/g, '-')
}

/** Downloads a .zip containing every note as a markdown file, mirroring the folder structure. */
export async function exportAllNotes(notes: Note[], folders: Folder[]): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Map<string, number>()

  for (const note of notes) {
    const dir = folderPath(folders, note.folder_id)
    const base = sanitizeFilename(note.title)
    const key = `${dir}/${base}`
    const count = usedNames.get(key) ?? 0
    usedNames.set(key, count + 1)

    const filename = count === 0 ? `${base}.md` : `${base} (${count}).md`
    zip.file(dir ? `${dir}/${filename}` : filename, note.content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `leaf-export-${new Date().toISOString().slice(0, 10)}.zip`
  link.click()
  URL.revokeObjectURL(url)
}
