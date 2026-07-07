import { useActiveEditor } from '@/lib/editorStore'
import { EditorToolbar } from '@/components/EditorToolbar'

export function EditorToolbarContainer() {
  const editor = useActiveEditor()

  if (!editor) return null

  return (
    <div className="border-b border-border bg-background p-1 mb-4">
      <EditorToolbar editor={editor} />
    </div>
  )
}
