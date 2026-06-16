import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropZone } from '@/components/import/DropZone'
import { ImportPreview } from '@/components/import/ImportPreview'
import { useFolders } from '@/hooks/useFolders'
import { useImportFolder } from '@/hooks/useImportFolder'
import type { FileEntry } from '@/lib/import'
import type { ImportFolderStats } from '@/hooks/useImportFolder'

type Stage = 'drop' | 'preview' | 'done'

export default function ImportPage() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('drop')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [result, setResult] = useState<ImportFolderStats | null>(null)

  const { data: folders = [] } = useFolders()
  const importFolder = useImportFolder()

  const existingFolderNames = new Set(folders.map((f) => f.name))

  const handleEntries = (newEntries: FileEntry[]) => {
    setEntries(newEntries)
    setStage('preview')
  }

  const handleImport = async () => {
    try {
      const stats = await importFolder.mutateAsync(entries)
      setResult(stats)
      setStage('done')
      if (stats.notesCreated > 0) {
        toast.success(`Imported ${stats.notesCreated} note${stats.notesCreated !== 1 ? 's' : ''}`)
      }
    } catch {
      toast.error('Import failed. Please try again.')
    }
  }

  const handleReset = () => {
    setEntries([])
    setStage('drop')
  }

  if (stage === 'drop') return <DropZone onEntries={handleEntries} />

  if (stage === 'preview') {
    return (
      <ImportPreview
        entries={entries}
        existingFolderNames={existingFolderNames}
        onImport={handleImport}
        onReset={handleReset}
        isImporting={importFolder.isPending}
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">Import complete</h1>
      <p className="text-muted-foreground">
        {result?.notesCreated ?? 0} note{(result?.notesCreated ?? 0) !== 1 ? 's' : ''} imported
        {(result?.foldersCreated ?? 0) > 0
          ? ` into ${result?.foldersCreated} new folder${(result?.foldersCreated ?? 0) !== 1 ? 's' : ''}`
          : ''}
        {(result?.notesFailed ?? 0) > 0 ? ` · ${result?.notesFailed} failed` : ''}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReset}>
          Import more
        </Button>
        <Button onClick={() => navigate('/app')}>
          View notes
        </Button>
      </div>
    </div>
  )
}
