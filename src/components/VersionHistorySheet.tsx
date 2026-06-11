import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { formatRelativeTime } from '@/lib/utils'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import type { NoteFields } from '@/hooks/useNotes'
import type { Note, NoteVersion } from '@/types'

interface VersionHistorySheetProps {
  note: Note | null
  onOpenChange: (open: boolean) => void
  updateNote: (id: string, fields: NoteFields) => void
}

export function VersionHistorySheet({ note, onOpenChange, updateNote }: VersionHistorySheetProps) {
  const { versions, loading, restoreVersion } = useVersionHistory(note?.id ?? null, updateNote)
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null)

  useEffect(() => {
    setSelectedVersion(null)
  }, [note?.id])

  const previewEditor = useEditor(
    {
      extensions: createEditorExtensions(),
      content: selectedVersion?.content ?? '',
      editable: false,
      editorProps: {
        attributes: { class: 'markdown-preview' },
      },
    },
    [selectedVersion?.id]
  )

  const handleRestore = () => {
    if (!selectedVersion) return
    restoreVersion(selectedVersion)
    onOpenChange(false)
  }

  return (
    <Sheet open={note !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Past versions of "{note?.title || 'Untitled'}"
          </SheetDescription>
        </SheetHeader>

        {selectedVersion ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVersion(null)}
              className="-ml-2 w-fit gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to versions
            </Button>

            <div className="flex shrink-0 items-center justify-between gap-4">
              <p
                className="text-sm text-muted-foreground"
                title={new Date(selectedVersion.saved_at).toLocaleString()}
              >
                {formatRelativeTime(selectedVersion.saved_at)}
              </p>
              <Button type="button" size="sm" onClick={handleRestore}>
                Restore this version
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border p-4">
              {previewEditor && <EditorContent editor={previewEditor} />}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading versions…</p>
            ) : versions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No saved versions yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedVersion(version)}
                      className="w-full px-1 py-3 text-left transition-colors hover:bg-accent"
                    >
                      <p
                        className="text-sm font-medium text-foreground"
                        title={new Date(version.saved_at).toLocaleString()}
                      >
                        {formatRelativeTime(version.saved_at)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {version.title || 'Untitled'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
