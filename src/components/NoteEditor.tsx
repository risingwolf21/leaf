import { useEffect, useLayoutEffect, useRef } from 'react'
import { useEditor } from '@tiptap/react'
import { isChangeOrigin } from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { NoteMetaRow } from '@/components/NoteMetaRow'
import { NoteEditorContent } from '@/components/NoteEditorContent'
import { ReadOnlyNoteView } from '@/components/ReadOnlyNoteView'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { setActiveEditor } from '@/lib/editorStore'
import { bytesToBase64 } from '@/lib/yjsState'
import { cn } from '@/lib/utils'
import type { CollaborationConfig, Note, NoteFields, ShareRole, Tag, ViewMode } from '@/types'

export type SharedContext = {
  role: ShareRole
}

type NoteEditorProps = {
  note: Note
  notes: Note[]
  noteTags: Tag[]
  allTags: Tag[]
  mode: ViewMode
  onChange: (id: string, fields: NoteFields) => void
  onNavigateToNote: (title: string) => void
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  onRemoveTag: (noteId: string, tagId: string) => Promise<void>
  /** Set when viewing a note shared by another user; restricts editing and sharing controls. */
  sharedContext?: SharedContext
  /** Set when the note has live collaborators; binds the editor to a shared Yjs document. */
  collaboration?: CollaborationConfig
}

export function NoteEditor({
  note,
  notes,
  noteTags,
  allTags,
  mode,
  onChange,
  onNavigateToNote,
  onAddTag,
  onRemoveTag,
  sharedContext,
  collaboration,
}: NoteEditorProps) {
  const noteRef = useRef(note)
  noteRef.current = note

  const isReadOnly = sharedContext?.role === 'viewer'
  // Raw markdown editing bypasses the Yjs document, so collaborative notes
  // always fall back to the rich editor instead of source/split mode.
  const effectiveMode: ViewMode = collaboration && (mode === 'source' || mode === 'split') ? 'edit' : mode
  // Source/split fill the available height and scroll internally; edit mode
  // keeps its natural content height so the page itself scrolls.
  const isRawMode = effectiveMode === 'source' || effectiveMode === 'split'

  const editor = useEditor(
    {
      extensions: createEditorExtensions('Start writing…', collaboration),
      content: collaboration ? undefined : note.content,
      editable: false,
      editorProps: {
        attributes: {
          class: 'markdown-preview min-h-editor focus:outline-none pb-8',
        },
      },
      onUpdate: ({ editor, transaction }) => {
        // Remote Yjs changes are mirrored into ProseMirror as their own
        // transaction; skip those so we only persist the user's own edits.
        if (collaboration && isChangeOrigin(transaction)) return
        const fields: NoteFields = { content: editor.storage.markdown.getMarkdown() }
        if (collaboration) {
          fields.ydoc_state = bytesToBase64(Y.encodeStateAsUpdate(collaboration.ydoc))
        }
        onChange(noteRef.current.id, fields)
      },
    },
    [note.id, collaboration?.ydoc]
  )

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!isReadOnly && effectiveMode === 'edit', false)
    // Yjs is the source of truth for collaborative content; pushing the last
    // saved markdown snapshot in here would clobber newer, unsaved live edits.
    if (effectiveMode !== 'source' && !collaboration) {
      editor.commands.setContent(noteRef.current.content, false)
    }
  }, [effectiveMode, editor, isReadOnly, collaboration])

  useLayoutEffect(() => {
    if (!editor) return
    editor.storage.wikiLink.noteTitles = new Set(notes.map((item) => item.title))
    editor.storage.wikiLink.onNavigate = onNavigateToNote
    editor.view.dispatch(editor.state.tr)
  }, [editor, notes, onNavigateToNote])

  useEffect(() => {
    if (!editor) return
    setActiveEditor(editor)
    return () => setActiveEditor(null)
  }, [editor])

  if (!editor) return null

  if (isReadOnly) {
    return <ReadOnlyNoteView note={note} editor={editor} />
  }

  const handleSourceChange = (content: string) => {
    onChange(note.id, { content })
    if (effectiveMode === 'split') {
      editor.commands.setContent(content, false)
    }
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col px-4 py-3 sm:px-6 md:py-6',
        effectiveMode === 'split' ? 'max-w-note-wide' : 'max-w-note',
        isRawMode && 'h-full min-h-0'
      )}
    >
      <input
        value={note.title}
        onChange={(e) => onChange(note.id, { title: e.target.value })}
        placeholder="Untitled"
        className="mb-2 w-full shrink-0 bg-transparent text-2xl font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      {!sharedContext && (
        <NoteMetaRow
          note={note}
          tags={noteTags}
          allTags={allTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      )}

      <NoteEditorContent
        mode={effectiveMode}
        editor={editor}
        content={note.content}
        onSourceChange={handleSourceChange}
      />
    </div>
  )
}
