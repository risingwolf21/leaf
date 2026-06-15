import { Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCreateNote } from '@/hooks/useCreateNote'

/** Strips a trailing .md/.markdown extension, falling back to "Untitled" for an empty name. */
function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.(md|markdown)$/i, '')
  return base.trim() || 'Untitled'
}

/** Imports one note per selected markdown file into the given folder. */
export function ImportNotesButton({ folderId }: { folderId: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const createNote = useCreateNote()

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // Reset so selecting the same file(s) again still fires this handler.
    event.target.value = ''
    if (files.length === 0) return

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const content = await file.text()
        const title = titleFromFilename(file.name)
        return createNote.mutateAsync({ folderId, fields: { title, content } })
      })
    )

    const failedCount = results.filter((result) => result.status === 'rejected').length
    const succeededCount = results.length - failedCount

    if (succeededCount > 0) {
      toast.success(succeededCount === 1 ? 'Imported 1 note' : `Imported ${succeededCount} notes`)
    }
    if (failedCount > 0) {
      toast.error(failedCount === 1 ? 'Failed to import 1 note' : `Failed to import ${failedCount} notes`)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        variant="outline"
        size="icon"
        aria-label="Import markdown files"
        title="Import markdown files"
      >
        <Upload className="h-4 w-4" />
      </Button>
    </>
  )
}
