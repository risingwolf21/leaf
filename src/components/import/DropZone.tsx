import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { filesToEntries, readDroppedItems } from '@/lib/import'
import type { FileEntry } from '@/lib/import'

// webkitdirectory is not in React's InputHTMLAttributes typings.
type FolderInputProps = React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string }

export function DropZone({ onEntries }: { onEntries: (entries: FileEntry[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isReading, setIsReading] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setIsReading(true)
    try {
      const entries = await readDroppedItems(e.dataTransfer)
      if (entries.length > 0) onEntries(entries)
    } finally {
      setIsReading(false)
    }
  }

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length > 0) onEntries(filesToEntries(files))
  }

  const handleFolderSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length > 0) onEntries(filesToEntries(files))
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex w-full max-w-lg flex-col items-center gap-6 rounded-xl border-2 border-dashed p-12 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
        )}
      >
        <Upload className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-medium">
            {isReading ? 'Reading files…' : 'Drop your notes folder here'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Supports Apple Notes Exporter format</p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <input
            {...({ webkitdirectory: '' } as FolderInputProps)}
            ref={folderInputRef}
            type="file"
            onChange={handleFolderSelected}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isReading}>
            Select files
          </Button>
          <Button variant="outline" onClick={() => folderInputRef.current?.click()} disabled={isReading}>
            Select folder
          </Button>
        </div>
      </div>
    </div>
  )
}
