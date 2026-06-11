import { useEffect, useLayoutEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { EditorToolbar } from '@/components/EditorToolbar'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { cn } from '@/lib/utils'
import type { Note, ViewMode } from '@/types'

interface NoteEditorProps {
  note: Note
  notes: Note[]
  isSaving: boolean
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  onChange: (id: string, fields: { title?: string; content?: string }) => void
  onNavigateToNote: (title: string) => void
}

export function NoteEditor({
  note,
  notes,
  isSaving,
  mode,
  onModeChange,
  onChange,
  onNavigateToNote,
}: NoteEditorProps) {
  const noteRef = useRef(note)
  noteRef.current = note

  const editor = useEditor(
    {
      extensions: createEditorExtensions('Start writing…'),
      content: note.content,
      editable: false,
      editorProps: {
        attributes: {
          class: 'markdown-preview min-h-full focus:outline-none pb-8',
        },
      },
      onUpdate: ({ editor }) => {
        onChange(noteRef.current.id, { content: editor.storage.markdown.getMarkdown() })
      },
    },
    [note.id]
  )

  useEffect(() => {
    if (!editor) return
    editor.setEditable(mode === 'edit', false)
    if (mode !== 'source') {
      editor.commands.setContent(noteRef.current.content, false)
    }
  }, [mode, editor])

  useLayoutEffect(() => {
    if (!editor) return
    editor.storage.wikiLink.noteTitles = new Set(notes.map((item) => item.title))
    editor.storage.wikiLink.onNavigate = onNavigateToNote
    editor.view.dispatch(editor.state.tr)
  }, [editor, notes, onNavigateToNote])

  if (!editor) return null

  return (
    <div className="mx-auto flex h-full w-full max-w-[960px] flex-col px-4 py-3 sm:px-6 md:py-6">
      <div className="mb-4 hidden shrink-0 items-center justify-between gap-4 md:flex">
        <input
          value={note.title}
          onChange={(e) => onChange(note.id, { title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('text-xs', isSaving ? 'text-muted-foreground' : 'text-primary')}>
            {isSaving ? 'Saving…' : 'Saved'}
          </span>
          <EditorModeToggle mode={mode} onModeChange={onModeChange} />
        </div>
      </div>

      {mode === 'source' ? (
        <textarea
          value={note.content}
          onChange={(e) => onChange(note.id, { content: e.target.value })}
          placeholder="Start writing…"
          spellCheck
          className="h-full w-full flex-1 resize-none bg-transparent font-mono text-sm leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {mode === 'edit' && (
            <div className="mb-2 shrink-0 rounded-md border border-border p-1">
              <EditorToolbar editor={editor} />
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      )}
    </div>
  )
}
