import JSZip from 'jszip'
import type { Folder, Note } from '@/types'

function safeFileName(title: string) {
  return title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Downloads a single note as a `.md` file containing its raw markdown content. */
export function downloadMarkdown(title: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  triggerDownload(blob, `${safeFileName(title)}.md`)
}

/** Downloads all notes as a `.zip`, grouping notes into subdirectories named after their folder. */
export async function exportAllNotes(notes: Note[], folders: Folder[]) {
  const zip = new JSZip()
  const folderMap = new Map(folders.map((folder) => [folder.id, folder.name]))

  for (const note of notes) {
    const folderName = note.folder_id ? folderMap.get(note.folder_id) ?? 'Unfiled' : 'Unfiled'
    zip.folder(folderName)?.file(`${safeFileName(note.title)}.md`, note.content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, 'leaf-notes.zip')
}
