import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { notesKeys } from '@/lib/queryKeys'
import { useConflicts } from '@/lib/conflictStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ConflictResolver() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { conflicts, removeConflict } = useConflicts()
  const [isOpen, setIsOpen] = useState(false)

  if (conflicts.length === 0) return null

  const current = conflicts[0]

  const handleKeepMine = async () => {
    await supabase
      .from('notes')
      .update({ ...current.localVersion, updated_at: new Date().toISOString() })
      .eq('id', current.noteId)
    removeConflict(current.noteId)
    await queryClient.invalidateQueries({ queryKey: notesKeys.all(user?.id) })
    if (conflicts.length === 1) setIsOpen(false)
  }

  const handleKeepServer = () => {
    removeConflict(current.noteId)
    if (conflicts.length === 1) setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => setIsOpen(open)

  return (
    <>
      <div className="flex items-center gap-2 bg-destructive/10 px-4 py-2 text-sm text-destructive border-b border-destructive/20">
        <Badge variant="destructive">{conflicts.length}</Badge>
        <span>
          {conflicts.length === 1 ? '1 sync conflict needs' : `${conflicts.length} sync conflicts need`} your attention.
        </span>
        <button
          className="ml-auto underline underline-offset-2 hover:no-underline"
          onClick={() => setIsOpen(true)}
        >
          Review conflicts
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sync conflict: &ldquo;{current.noteTitle}&rdquo;</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground px-4">
            This note was edited elsewhere while you were offline.
            Choose which version to keep.
          </p>

          <div className="grid grid-cols-2 gap-4 px-4 pb-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your local version
              </span>
              <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs max-h-64 whitespace-pre-wrap break-words">
                {current.localVersion.title && (
                  <span className="font-semibold block mb-1">{current.localVersion.title}</span>
                )}
                {current.localVersion.content ?? '(no content)'}
              </pre>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Server version (saved {new Date(current.serverVersion.updated_at).toLocaleString()})
              </span>
              <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs max-h-64 whitespace-pre-wrap break-words">
                <span className="font-semibold block mb-1">{current.serverVersion.title}</span>
                {current.serverVersion.content}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t px-4 pt-4 pb-2">
            <Button variant="outline" onClick={handleKeepServer}>
              Dismiss
            </Button>
            <Button variant="outline" onClick={handleKeepServer}>
              Keep server
            </Button>
            <Button onClick={handleKeepMine}>Keep mine</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
