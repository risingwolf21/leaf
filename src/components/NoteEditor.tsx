import { useEffect, useLayoutEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { EditorToolbar } from '@/components/EditorToolbar'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { SharePanel } from '@/components/SharePanel'
import { TagBar } from '@/components/TagBar'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { cn } from '@/lib/utils'
import type { NoteFields } from '@/hooks/useNotes'
import type { Note, ShareRole, Tag, ViewMode } from '@/types'

export interface SharedContext {
  role: ShareRole
}

interface NoteEditorProps {
  note: Note
  notes: Note[]
  noteTags: Tag[]
  allTags: Tag[]
  isSaving: boolean
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  onChange: (id: string, fields: NoteFields) => void
  onNavigateToNote: (title: string) => void
  onShare: (id: string) => Promise<string>
  onUnshare: (id: string) => Promise<void>
  onSaveAsTemplate: (name: string, content: string) => Promise<void>
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  onRemoveTag: (noteId: string, tagId: string) => Promise<void>
  /** Set when viewing a note shared by another user; restricts editing and sharing controls. */
  sharedContext?: SharedContext
}

export function NoteEditor({
  note,
  notes,
  noteTags,
  allTags,
  isSaving,
  mode,
  onModeChange,
  onChange,
  onNavigateToNote,
  onShare,
  onUnshare,
  onSaveAsTemplate,
  onAddTag,
  onRemoveTag,
  sharedContext,
}: NoteEditorProps) {
  const noteRef = useRef(note)
  noteRef.current = note

  const isReadOnly = sharedContext?.role === 'viewer'

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
    editor.setEditable(!isReadOnly && mode === 'edit', false)
    if (mode !== 'source') {
      editor.commands.setContent(noteRef.current.content, false)
    }
  }, [mode, editor, isReadOnly])

  useLayoutEffect(() => {
    if (!editor) return
    editor.storage.wikiLink.noteTitles = new Set(notes.map((item) => item.title))
    editor.storage.wikiLink.onNavigate = onNavigateToNote
    editor.view.dispatch(editor.state.tr)
  }, [editor, notes, onNavigateToNote])

  if (!editor) return null

  if (isReadOnly) {
    return (
      <div className="mx-auto flex h-full w-full max-w-[960px] flex-col px-4 py-3 sm:px-6 md:py-6">
        <div className="mb-4 shrink-0">
          <h1 className="hidden truncate text-2xl font-semibold text-foreground md:block">
            {note.title || 'Untitled'}
          </h1>
          <div className="mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            You can view this note but cannot edit it.
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    )
  }

  const handleSourceChange = (content: string) => {
    onChange(note.id, { content })
    if (mode === 'split') {
      editor.commands.setContent(content, false)
    }
  }

  return (
    <div
      className={cn(
        'mx-auto flex h-full w-full flex-col px-4 py-3 sm:px-6 md:py-6',
        mode === 'split' ? 'max-w-[1400px]' : 'max-w-[960px]'
      )}
    >
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
          {!sharedContext && <SharePanel note={note} onShare={onShare} onUnshare={onUnshare} onChange={onChange} />}
          <EditorModeToggle mode={mode} onModeChange={onModeChange} />
          {!sharedContext && <SaveAsTemplatePopover note={note} onSaveAsTemplate={onSaveAsTemplate} />}
        </div>
      </div>

      {!sharedContext && (
        <TagBar
          noteId={note.id}
          tags={noteTags}
          allTags={allTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      )}

      {mode === 'split' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <textarea
            value={note.content}
            onChange={(e) => handleSourceChange(e.target.value)}
            placeholder="Start writing…"
            spellCheck
            className="min-h-0 flex-1 resize-none overflow-y-auto bg-transparent pb-4 font-mono text-sm leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground md:basis-1/2 md:pb-0 md:pr-4"
          />
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border pt-4 md:basis-1/2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {mode === 'source' ? (
            <textarea
              value={note.content}
              onChange={(e) => handleSourceChange(e.target.value)}
              placeholder="Start writing…"
              spellCheck
              className="min-h-[300px] w-full resize-none bg-transparent font-mono text-sm leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <>
              {mode === 'edit' && (
                <div className="sticky top-0 z-10 mb-2 rounded-md border border-border bg-background p-1">
                  <EditorToolbar editor={editor} />
                </div>
              )}
              <EditorContent editor={editor} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
