import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { NoteEditor } from '@/components/NoteEditor'
import type { SharedContext } from '@/components/NoteEditor'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNotes } from '@/hooks/useNotes'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useAddTagToNote } from '@/hooks/useAddTagToNote'
import { useRemoveTagFromNote } from '@/hooks/useRemoveTagFromNote'
import { useTags } from '@/hooks/useTags'
import { useNoteCollaboration } from '@/hooks/useNoteCollaboration'
import { notePath } from '@/lib/routes'
import type { ViewMode } from '@/types'

export default function NoteEditorPage() {
  const { noteId, folderId, tagId } = useParams<{ noteId: string; folderId?: string; tagId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<ViewMode>('edit')

  // Split view doesn't fit on mobile; fall back if the viewport shrinks while active.
  useEffect(() => {
    if (isMobile && mode === 'split') setMode('edit')
  }, [isMobile, mode])

  const { data: notes = [], isLoading: loading } = useNotes()
  const { data: sharedNotes = [], isLoading: sharedLoading } = useSharedNotes()
  const { data: tags = [] } = useTags()

  const addTagToNote = useAddTagToNote()
  const removeTagFromNote = useRemoveTagFromNote()

  const ownNote = notes.find((note) => note.id === noteId) ?? null
  const sharedNote = ownNote ? null : sharedNotes.find((note) => note.id === noteId) ?? null
  const activeNote = ownNote ?? sharedNote
  const sharedContext: SharedContext | undefined = sharedNote ? { role: sharedNote.my_role } : undefined

  const { isCollaborative, collaboration } = useNoteCollaboration(activeNote, !!sharedContext, user)

  // Source/split modes edit raw markdown directly, bypassing the Yjs
  // document; force collaborative notes back to the rich editor.
  useEffect(() => {
    if (isCollaborative && (mode === 'source' || mode === 'split')) setMode('edit')
  }, [isCollaborative, mode])

  const handleNavigateToNote = useCallback(
    (title: string) => {
      const target = notes.find((item) => item.title === title)
      if (target) navigate(notePath(target.id, target.folder_id))
    },
    [notes, navigate]
  )

  const handleAddTag = async (id: string, tagName: string) => {
    await addTagToNote.mutateAsync({ noteId: id, tagName })
  }

  const handleRemoveTag = async (id: string, tagId: string) => {
    await removeTagFromNote.mutateAsync({ noteId: id, tagId })
  }

  const navigateBackPath = folderId ? `/app/folders/${folderId}` : `/app/tags/${tagId}`

  if (loading || sharedLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Loading notes…
      </div>
    )
  }

  if (!activeNote) {
    return <Navigate to={navigateBackPath} replace />
  }

  return (
    <div className="flex h-full flex-col w-full items-center">
      <div className='scrollbar-thin justify-center w-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-safe-bottom'>
        <NoteEditor
          note={activeNote}
          notes={notes}
          noteTags={ownNote?.tags ?? []}
          allTags={tags}
          mode={mode}
          onNavigateToNote={handleNavigateToNote}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          sharedContext={sharedContext}
          collaboration={collaboration}
        />
      </div>
    </div>
  )
}
