import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { EditorToolbar } from '@/components/EditorToolbar'
import { LinksPanel } from '@/components/LinksPanel'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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

type MobilePanel = 'note' | 'links'

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
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('note')

  const editor = useEditor(
    {
      extensions: createEditorExtensions('Start writing…'),
      content: note.content,
      editable: false,
      editorProps: {
        attributes: {
          class: 'markdown-preview min-h-[300px] focus:outline-none pb-8',
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

  useEffect(() => {
    setMobilePanel('note')
  }, [note.id])

  if (!editor) return null

  const editorContent =
    mode === 'source' ? (
      <textarea
        value={note.content}
        onChange={(e) => onChange(note.id, { content: e.target.value })}
        placeholder="Start writing…"
        spellCheck
        className="min-h-[300px] w-full resize-none bg-transparent font-mono text-sm leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground"
      />
    ) : (
      <>
        {mode === 'edit' && (
          <div className="mb-2 rounded-md border border-border p-1">
            <EditorToolbar editor={editor} />
          </div>
        )}
        <EditorContent editor={editor} />
      </>
    )

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

      {isDesktop ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {editorContent}
          <Separator className="my-6" />
          <LinksPanel noteId={note.id} />
        </div>
      ) : (
        <Tabs
          value={mobilePanel}
          onValueChange={(value) => setMobilePanel(value as MobilePanel)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {mobilePanel === 'note' ? editorContent : <LinksPanel noteId={note.id} />}
          </div>
          <TabsList className="mt-3 grid shrink-0 grid-cols-2">
            <TabsTrigger value="note">Note</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  )
}
