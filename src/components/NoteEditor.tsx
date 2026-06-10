import { useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

interface NoteEditorProps {
  note: Note
  isSaving: boolean
  onChange: (id: string, fields: { title?: string; content?: string }) => void
}

type ViewMode = 'edit' | 'preview'

export function NoteEditor({ note, isSaving, onChange }: NoteEditorProps) {
  const [mode, setMode] = useState<ViewMode>('edit')

  const html = DOMPurify.sanitize(marked.parse(note.content || '') as string)

  return (
    <div className="mx-auto flex h-full w-full max-w-[680px] flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <input
          value={note.title}
          onChange={(e) => onChange(note.id, { title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <span
          className={cn(
            'shrink-0 text-xs',
            isSaving ? 'text-muted-foreground' : 'text-primary'
          )}
        >
          {isSaving ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as ViewMode)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="min-h-0 flex-1">
          <textarea
            value={note.content}
            onChange={(e) => onChange(note.id, { content: e.target.value })}
            placeholder="Start writing…"
            spellCheck
            className="h-full w-full resize-none bg-transparent font-mono text-sm leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </TabsContent>

        <TabsContent value="preview" className="min-h-0 flex-1 overflow-y-auto">
          {note.content ? (
            <div
              className="markdown-preview pb-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
