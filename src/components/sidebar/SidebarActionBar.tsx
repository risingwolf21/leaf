import { useNavigate } from 'react-router-dom'
import { TemplatePicker } from '@/components/TemplatePicker'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useCreateNoteFromTemplate, useTemplates } from '@/hooks/useTemplates'
import { notePath } from '@/lib/routes'
import type { AnyTemplate } from '@/types'

/** Sidebar action bar: new note, with a template picker. */
export function SidebarActionBar() {
  const navigate = useNavigate()
  const { activeFolderId } = useActiveFolder()
  const { data: templates = [] } = useTemplates()
  const createNote = useCreateNote()
  const { createNoteFromTemplate } = useCreateNoteFromTemplate()

  const handleCreateBlank = () => {
    createNote.mutate(
      { folderId: activeFolderId },
      { onSuccess: (note) => navigate(notePath(note.id, activeFolderId)) }
    )
  }

  const handleSelectTemplate = (template: AnyTemplate) => {
    createNoteFromTemplate(template, activeFolderId, {
      onSuccess: (note) => navigate(notePath(note.id, activeFolderId)),
    })
  }

  return (
    <div className="border-b border-border p-2">
      <TemplatePicker
        templates={templates}
        onCreateBlank={handleCreateBlank}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  )
}
