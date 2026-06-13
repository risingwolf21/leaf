import { FolderPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TemplatePicker } from '@/components/TemplatePicker'
import { Button } from '@/components/ui/button'
import { useNotesContext } from '@/context/NotesContext'
import { SortPopover } from './SortPopover'
import type { AnyTemplate } from '@/types'

/** Files mode action bar: new note (with template picker), new folder, and sort. */
export function SidebarActionBar() {
  const navigate = useNavigate()
  const { activeFolderId, createNote, createNoteFromTemplate, templates, handleCreateFolder } = useNotesContext()

  const handleCreateBlank = async () => {
    const note = await createNote(activeFolderId)
    if (note) {
      navigate(`/app/notes/${note.id}`)
    }
  }

  const handleSelectTemplate = async (template: AnyTemplate) => {
    const note = await createNoteFromTemplate(template, activeFolderId)
    if (note) {
      navigate(`/app/notes/${note.id}`)
    }
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
      <SortPopover />
    </div>
  )
}
