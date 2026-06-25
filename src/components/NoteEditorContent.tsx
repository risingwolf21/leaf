import { EditorContent, type Editor } from '@tiptap/react'
import type { ViewMode } from '@/types'

type NoteEditorContentProps = {
  mode: ViewMode
  editor: Editor
  content: string
  onSourceChange: (content: string) => void
}

/** Renders the mode-dependent editor surface: split view, raw markdown source, or the rich editor. */
export function NoteEditorContent({ mode, editor, content, onSourceChange }: NoteEditorContentProps) {
  if (mode === 'split') {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <textarea
          value={content}
          onChange={(e) => onSourceChange(e.target.value)}
          placeholder="Start writing…"
          spellCheck
          className="min-h-0 flex-1 resize-none overflow-y-auto bg-transparent pb-4 font-mono text-sm leading-prose text-foreground outline-none placeholder:text-muted-foreground md:basis-1/2 md:pb-0 md:pr-4"
        />
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border pt-4 md:basis-1/2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <EditorContent editor={editor} />
        </div>
      </div>
    )
  }

  if (mode === 'source') {
    return (
      <textarea
        value={content}
        onChange={(e) => onSourceChange(e.target.value)}
        placeholder="Start writing…"
        spellCheck
        className="min-h-0 w-full flex-1 resize-none overflow-y-auto bg-transparent font-mono text-sm leading-prose text-foreground outline-none placeholder:text-muted-foreground"
      />
    )
  }

  return <EditorContent editor={editor} />
}
