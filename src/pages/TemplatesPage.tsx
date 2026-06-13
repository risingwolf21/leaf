import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { TemplatesView } from '@/components/TemplatesView'
import { useNotesContext } from '@/context/NotesContext'
import type { AnyTemplate } from '@/types'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { templates, activeFolderId, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate } =
    useNotesContext()

  const handleUseTemplate = async (template: AnyTemplate) => {
    const note = await createNoteFromTemplate(template, activeFolderId)
    if (note) navigate(`/app/notes/${note.id}`)
  }

  return (
    <AppShell>
      <TemplatesView
        templates={templates}
        onUseTemplate={handleUseTemplate}
        onSaveTemplate={saveAsTemplate}
        onRenameTemplate={renameTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </AppShell>
  )
}
