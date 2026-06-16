import { ChevronDown, ChevronRight, FileText, Folder as FolderIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { classifyFiles } from '@/lib/import'
import type { FileEntry } from '@/lib/import'

type FolderSection = { name: string; isNew: boolean; notes: string[]; imageCount: number }

type Props = {
  entries: FileEntry[]; existingFolderNames: Set<string>
  onImport: () => Promise<void>; onReset: () => void; isImporting: boolean
}

export function ImportPreview({ entries, existingFolderNames, onImport, onReset, isImporting }: Props) {
  const { sections, unfiledNotes, totalImages, totalNotes } = useMemo(() => {
    const { notes, images, folderNames } = classifyFiles(entries)

    const imageCounts = new Map<string | null, number>()
    for (const { folderName } of images.values()) {
      imageCounts.set(folderName, (imageCounts.get(folderName) ?? 0) + 1)
    }

    const notesByFolder = new Map<string, string[]>()
    const unfiled: string[] = []
    for (const { file, folderName } of notes) {
      const title = file.name.replace(/\.(md|markdown)$/i, '').trim() || 'Untitled'
      if (folderName) {
        const list = notesByFolder.get(folderName) ?? []
        list.push(title)
        notesByFolder.set(folderName, list)
      } else {
        unfiled.push(title)
      }
    }

    const sections: FolderSection[] = [...folderNames].map((name) => ({
      name,
      isNew: !existingFolderNames.has(name),
      notes: notesByFolder.get(name) ?? [],
      imageCount: imageCounts.get(name) ?? 0,
    }))

    return { sections, unfiledNotes: unfiled, totalImages: images.size, totalNotes: notes.length }
  }, [entries, existingFolderNames])

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([...sections.map((s) => s.name), '__unfiled__'])
  )

  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const newFolderCount = sections.filter((s) => s.isNew).length
  const hasContent = totalNotes > 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Import preview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalNotes} note{totalNotes !== 1 ? 's' : ''} ·{' '}
          {sections.length} folder{sections.length !== 1 ? 's' : ''}
          {newFolderCount > 0 ? ` (${newFolderCount} new)` : ''} ·{' '}
          {totalImages} image{totalImages !== 1 ? 's' : ''}
        </p>
      </div>

      {hasContent ? (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {sections.map((section) => (
            <div key={section.name}>
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50"
                onClick={() => toggle(section.name)}
              >
                {expanded.has(section.name) ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <FolderIcon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{section.name}</span>
                {section.isNew && <Badge variant="outline" className="ml-1 text-xs">New</Badge>}
                <span className="ml-auto text-sm text-muted-foreground">
                  {section.notes.length} note{section.notes.length !== 1 ? 's' : ''}
                  {section.imageCount > 0 ? ` · ${section.imageCount} image${section.imageCount !== 1 ? 's' : ''}` : ''}
                </span>
              </button>
              {expanded.has(section.name) && section.notes.length > 0 && (
                <ul className="border-t border-border bg-muted/20 px-4 py-2">
                  {section.notes.map((title) => (
                    <li key={title} className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {unfiledNotes.length > 0 && (
            <div>
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50"
                onClick={() => toggle('__unfiled__')}
              >
                {expanded.has('__unfiled__') ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <FileText className="h-4 w-4 shrink-0" />
                <span className="font-medium">Unfiled notes</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {unfiledNotes.length} note{unfiledNotes.length !== 1 ? 's' : ''}
                </span>
              </button>
              {expanded.has('__unfiled__') && (
                <ul className="border-t border-border bg-muted/20 px-4 py-2">
                  {unfiledNotes.map((title) => (
                    <li key={title} className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-border px-4 py-8 text-center text-muted-foreground">No supported markdown files found.</p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReset} disabled={isImporting}>
          Cancel
        </Button>
        <Button onClick={onImport} disabled={isImporting || !hasContent}>
          {isImporting ? 'Importing…' : `Import ${totalNotes} note${totalNotes !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  )
}
