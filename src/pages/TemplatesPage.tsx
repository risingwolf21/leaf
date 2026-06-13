import { useNavigate } from 'react-router-dom'
import { TemplatesView } from '@/components/TemplatesView'
import { useNotesContext } from '@/context/NotesContext'
import type { AnyTemplate } from '@/types'
import { AppBar } from '@/components/AppBar'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { templates, selectedFolderId, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate } =
    useNotesContext()

  const handleUseTemplate = async (template: AnyTemplate) => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNoteFromTemplate(template, folderId)
    if (note) navigate(`/app/notes/${note.id}`)
  }

  return (
    <div>
      <AppBar
        className='!border-b !shadow-sm'
        title={""}
      />
      <main className='flex-1 size-full pb-safe-bottom'>
        <TemplatesView
          templates={templates}
          onUseTemplate={handleUseTemplate}
          onSaveTemplate={saveAsTemplate}
          onRenameTemplate={renameTemplate}
          onDeleteTemplate={deleteTemplate}
        />
      </main>
    </div>
  )
}
