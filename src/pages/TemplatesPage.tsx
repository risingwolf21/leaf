import { useNavigate } from 'react-router-dom'
import { TemplatesView } from '@/components/TemplatesView'
import { useActiveFolder } from '@/hooks/useActiveFolder'
import {
  useCreateNoteFromTemplate,
  useDeleteTemplate,
  useRenameTemplate,
  useSaveAsTemplate,
  useTemplates,
} from '@/hooks/useTemplates'
import type { AnyTemplate } from '@/types'
import { notePath } from '@/lib/routes'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { data: templates = [] } = useTemplates()
  const { activeFolderId } = useActiveFolder()
  const saveAsTemplate = useSaveAsTemplate()
  const renameTemplate = useRenameTemplate()
  const deleteTemplate = useDeleteTemplate()
  const { createNoteFromTemplate } = useCreateNoteFromTemplate()

  const handleUseTemplate = (template: AnyTemplate) => {
    createNoteFromTemplate(template, activeFolderId, {
      onSuccess: (note) => navigate(notePath(note.id, activeFolderId)),
    })
  }

  const handleSaveTemplate = async (name: string, content: string) => {
    await saveAsTemplate.mutateAsync({ name, content })
  }

  return (
    <div className="size-full pb-safe-bottom">
      <TemplatesView
        templates={templates}
        onUseTemplate={handleUseTemplate}
        onSaveTemplate={handleSaveTemplate}
        onRenameTemplate={(id, name) => renameTemplate.mutate({ id, name })}
        onDeleteTemplate={deleteTemplate.mutate}
      />
    </div>
  )
}
