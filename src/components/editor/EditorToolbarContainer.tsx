import { useActiveEditor } from '@/lib/editorStore'
import { EditorToolbar } from '@/components/EditorToolbar'

export function EditorToolbarContainer() {
  const editor = useActiveEditor()

  if (!editor) return null

  return (
    <div className="border-t border-border bg-background p-1">
      <EditorToolbar editor={editor} />
    </div>
  )
}
