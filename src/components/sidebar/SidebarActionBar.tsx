import { FolderPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TemplatePicker } from '@/components/TemplatePicker'
import { Button } from '@/components/ui/button'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useCreateFolder } from '@/hooks/useCreateFolder'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useCreateNoteFromTemplate, useTemplates } from '@/hooks/useTemplates'
import { usePendingRename } from '@/lib/sidebarStore'
import { ImportButton } from './ImportButton'
import { SortPopover } from './SortPopover'
import type { AnyTemplate, SortBy } from '@/types'

/** Files mode action bar: new note (with template picker), new folder, and sort. */
export function SidebarActionBar({
  sortBy,
  setSortBy,
}: {
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
}) {
  const navigate = useNavigate()
  const { activeFolderId } = useActiveFolder()
  const { setPendingRename } = usePendingRename()
  const { data: templates = [] } = useTemplates()
  const createNote = useCreateNote()
  const { createNoteFromTemplate } = useCreateNoteFromTemplate()
  const createFolder = useCreateFolder()

  const handleCreateBlank = () => {
    createNote.mutate({ folderId: activeFolderId }, { onSuccess: (note) => navigate(`/app/notes/${note.id}`) })
  }

  const handleSelectTemplate = (template: AnyTemplate) => {
    createNoteFromTemplate(template, activeFolderId, {
      onSuccess: (note) => navigate(`/app/notes/${note.id}`),
    })
  }

  const handleCreateFolder = () => {
    createFolder.mutate(
      { name: 'New folder', parentId: activeFolderId },
      { onSuccess: (created) => setPendingRename({ kind: 'folder', id: created.id }) }
    )
  }

  return (
    <div className="flex gap-2 border-b border-border p-2">
      <TemplatePicker
        templates={templates}
        onCreateBlank={handleCreateBlank}
        onSelectTemplate={handleSelectTemplate}
      />
      <Button onClick={handleCreateFolder} variant="outline" size="icon" aria-label="New folder" title="New folder">
        <FolderPlus className="h-4 w-4" />
      </Button>
      <ImportButton />
      <SortPopover sortBy={sortBy} setSortBy={setSortBy} />
    </div>
  )
}
