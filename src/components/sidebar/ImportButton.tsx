import { FileText, FolderOpen, Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useImportFolder } from '@/hooks/useImportFolder'

// webkitdirectory is not in React's InputHTMLAttributes typings.
type FolderInputProps = React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string }

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.(md|markdown)$/i, '')
  return base.trim() || 'Untitled'
}

/** Import button with two modes: individual .md files, or a whole export folder. */
export function ImportButton({ folderId }: { folderId: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const createNote = useCreateNote()
  const importFolder = useImportFolder()

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const results = await Promise.allSettled(
      files.map((file) =>
        file.text().then((content) =>
          createNote.mutateAsync({ folderId, fields: { title: titleFromFilename(file.name), content } })
        )
      )
    )

    const failed = results.filter((r) => r.status === 'rejected').length
    const succeeded = results.length - failed
    if (succeeded > 0) toast.success(succeeded === 1 ? 'Imported 1 note' : `Imported ${succeeded} notes`)
    if (failed > 0) toast.error(failed === 1 ? 'Failed to import 1 note' : `Failed to import ${failed} notes`)
  }

  const handleFolderSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const stats = await importFolder.mutateAsync(files)

    if (stats.notesCreated > 0) {
      const notes = stats.notesCreated === 1 ? '1 note' : `${stats.notesCreated} notes`
      const folders = stats.foldersCreated > 0
        ? ` in ${stats.foldersCreated} new ${stats.foldersCreated === 1 ? 'folder' : 'folders'}`
        : ''
      toast.success(`Imported ${notes}${folders}`)
    }
    if (stats.imagesUploaded > 0) toast.success(`Uploaded ${stats.imagesUploaded} image${stats.imagesUploaded === 1 ? '' : 's'}`)
    if (stats.notesFailed > 0) toast.error(`Failed to import ${stats.notesFailed} note${stats.notesFailed === 1 ? '' : 's'}`)
    if (stats.imagesFailed > 0) toast.warning(`${stats.imagesFailed} image${stats.imagesFailed === 1 ? '' : 's'} could not be uploaded`)
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".md,.markdown,text/markdown" multiple onChange={handleFilesSelected} className="hidden" />
      <input {...({ webkitdirectory: '' } as FolderInputProps)} ref={folderInputRef} type="file" onChange={handleFolderSelected} className="hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Import notes" title="Import notes">
              <Upload className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <FileText className="mr-2 h-4 w-4" />
            Import files
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => folderInputRef.current?.click()}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Import folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
