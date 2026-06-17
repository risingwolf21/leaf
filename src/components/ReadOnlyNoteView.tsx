import { EditorContent, type Editor } from '@tiptap/react'
import type { Note } from '@/types'

type ReadOnlyNoteViewProps = {
  note: Note
  editor: Editor
}

/** Renders a shared note for viewer-role collaborators, who can read but not edit. */
export function ReadOnlyNoteView({ note, editor }: ReadOnlyNoteViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-note flex-col px-4 py-3 sm:px-6 md:py-6">
      <div className="mb-4">
        <h1 className="truncate text-2xl font-semibold text-foreground">{note.title || 'Untitled'}</h1>
        <div className="mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          You can view this note but cannot edit it.
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
