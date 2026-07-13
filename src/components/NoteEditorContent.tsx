import { EditorContent, type Editor } from '@tiptap/react'

type NoteEditorContentProps = {
  editor: Editor
}

/** Renders the mode-dependent editor surface: split view, raw markdown source, or the rich editor. */
export function NoteEditorContent({ editor }: NoteEditorContentProps) {

  return <EditorContent editor={editor} />
}
