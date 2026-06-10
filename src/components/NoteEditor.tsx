import { useEffect, useRef, useState } from 'react'
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from 'tiptap-markdown'
import { Code2 } from 'lucide-react'
import { EditorToolbar } from '@/components/EditorToolbar'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

interface NoteEditorProps {
  note: Note
  isSaving: boolean
  onChange: (id: string, fields: { title?: string; content?: string }) => void
}

type ViewMode = 'visual' | 'source'

export function NoteEditor({ note, isSaving, onChange }: NoteEditorProps) {
  const [mode, setMode] = useState<ViewMode>('visual')
  const noteRef = useRef(note)
  noteRef.current = note

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder: 'Start writing…' }),
        Link.configure({ openOnClick: false, autolink: true }),
        Image,
        TaskList,
        TaskItem.configure({ nested: false }),
        Markdown.configure({ html: false, transformPastedText: true }),
      ],
      content: note.content,
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
    if (mode === 'visual' && editor) {
      editor.commands.setContent(noteRef.current.content, false)
    }
  }, [mode, editor])

  if (!editor) return null

  return (
    <div className="mx-auto flex h-full w-full max-w-[680px] flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
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
          <Toggle
            size="sm"
            pressed={mode === 'source'}
            onPressedChange={(pressed) => setMode(pressed ? 'source' : 'visual')}
            aria-label="Toggle source view"
          >
            <Code2 className="h-4 w-4" />
          </Toggle>
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
          <div className="mb-2 shrink-0 rounded-md border border-border p-1 md:hidden">
            <EditorToolbar editor={editor} />
          </div>
          <BubbleMenu
            editor={editor}
            shouldShow={({ editor, from, to }) =>
              window.innerWidth >= 768 && from !== to && editor.isEditable
            }
            className="flex rounded-md border border-border bg-popover p-1 shadow-md"
          >
            <EditorToolbar editor={editor} />
          </BubbleMenu>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      )}
    </div>
  )
}
