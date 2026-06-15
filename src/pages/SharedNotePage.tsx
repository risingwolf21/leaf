import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { createEditorExtensions } from '@/lib/editor-extensions'
import type { Note } from '@/types'

type SharedNotePreview = Pick<Note, 'id' | 'title' | 'content'>

export default function SharedNotePage() {
  const { token } = useParams<{ token: string }>()
  const [note, setNote] = useState<SharedNotePreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .rpc('get_shared_note_by_token', { p_token: token })
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        // Supabase client has no generated Database types, so query/RPC results are `any`.
        setNote((data as SharedNotePreview | null) ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    document.title = note ? `${note.title || 'Untitled'} — Leaf` : 'Leaf'
  }, [note])

  const editor = useEditor(
    {
      extensions: createEditorExtensions(),
      content: note?.content ?? '',
      editable: false,
      editorProps: {
        attributes: { class: 'markdown-preview' },
      },
    },
    [note?.id]
  )

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">Leaf</span>
        </Link>
        {note && (
          <Button render={<Link to="/">Open in Leaf</Link>} size="sm" />
        )}
      </header>

      <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 md:py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : note ? (
          <>
            <h1 className="mb-4 border-b border-border pb-4 text-3xl font-bold text-foreground">
              {note.title || 'Untitled'}
            </h1>
            {editor && <EditorContent editor={editor} />}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-xl font-semibold text-foreground">This note is no longer available.</h1>
            <p className="text-sm text-muted-foreground">The link may have been revoked by its owner.</p>
            <Button render={<Link to="/">Open Leaf</Link>}/>
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        Shared with Leaf · leaf.app
      </footer>
    </div>
  )
}
