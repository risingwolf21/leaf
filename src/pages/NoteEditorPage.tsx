import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { NoteEditor } from '@/components/NoteEditor'
import type { SharedContext } from '@/components/NoteEditor'
import { AppBar } from '@/components/AppBar'
import { SharePanel } from '@/components/SharePanel'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { useAuth } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNotes } from '@/hooks/useNotes'
import { useShareNote } from '@/hooks/useShareNote'
import { useUnshareNote } from '@/hooks/useUnshareNote'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useUpdateSharedNote } from '@/hooks/useUpdateSharedNote'
import { useAddTagToNote } from '@/hooks/useAddTagToNote'
import { useRemoveTagFromNote } from '@/hooks/useRemoveTagFromNote'
import { useTags } from '@/hooks/useTags'
import { useSaveAsTemplate } from '@/hooks/useTemplates'
import { tagsKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/types'

export default function NoteEditorPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<ViewMode>('preview')

  // Split view doesn't fit on mobile; fall back if the viewport shrinks while active.
  useEffect(() => {
    if (isMobile && mode === 'split') setMode('preview')
  }, [isMobile, mode])

  const { data: notes = [], isLoading: loading } = useNotes()
  const { data: sharedNotes = [], isLoading: sharedLoading } = useSharedNotes()
  const { data: tags = [] } = useTags()

  const { updateNote, savingIds } = useUpdateNote(() => {
    queryClient.invalidateQueries({ queryKey: tagsKeys.all(user?.id) })
  })
  const { updateSharedNote, savingIds: sharedSavingIds } = useUpdateSharedNote()
  const shareNote = useShareNote()
  const unshareNote = useUnshareNote()
  const saveAsTemplate = useSaveAsTemplate()
  const addTagToNote = useAddTagToNote()
  const removeTagFromNote = useRemoveTagFromNote()

  const ownNote = notes.find((note) => note.id === noteId) ?? null
  const sharedNote = ownNote ? null : sharedNotes.find((note) => note.id === noteId) ?? null
  const activeNote = ownNote ?? sharedNote
  const sharedContext: SharedContext | undefined = sharedNote ? { role: sharedNote.my_role } : undefined
  const handleChange = sharedContext ? updateSharedNote : updateNote
  const isSaving = activeNote ? (sharedContext ? sharedSavingIds : savingIds).has(activeNote.id) : false
  const isReadOnly = sharedContext?.role === 'viewer'

  const handleNavigateToNote = useCallback(
    (title: string) => {
      const target = notes.find((item) => item.title === title)
      if (target) navigate(`/app/notes/${target.id}`)
    },
    [notes, navigate]
  )

  const handleShare = async (id: string) => {
    const { url } = await shareNote.mutateAsync(id)
    return url
  }

  const handleSaveAsTemplate = async (name: string, content: string) => {
    await saveAsTemplate.mutateAsync({ name, content })
  }

  const handleAddTag = async (id: string, tagName: string) => {
    await addTagToNote.mutateAsync({ noteId: id, tagName })
  }

  const handleRemoveTag = async (id: string, tagId: string) => {
    await removeTagFromNote.mutateAsync({ noteId: id, tagId })
  }

  if (loading || sharedLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Loading notes…
      </div>
    )
  }

  if (!activeNote) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex h-full flex-col">
      <AppBar
        className='!border-b !shadow-sm'
        actions={<>
          {!isReadOnly && (
            <span className={cn('shrink-0 text-xs', isSaving ? 'text-muted-foreground' : 'text-primary')}>
              {isSaving ? 'Saving…' : 'Saved'}
            </span>
          )}
          {!sharedContext && (
            <SharePanel note={activeNote} onShare={handleShare} onUnshare={unshareNote.mutateAsync} onChange={updateNote} />
          )}
          {!isReadOnly && <EditorModeToggle mode={mode} onModeChange={setMode} />}
          {!sharedContext && <SaveAsTemplatePopover note={activeNote} onSaveAsTemplate={handleSaveAsTemplate} />}
        </>}
      />
      <main className='min-h-0 flex-1 pb-safe-bottom'>
        <NoteEditor
          note={activeNote}
          notes={notes}
          noteTags={ownNote?.tags ?? []}
          allTags={tags}
          mode={mode}
          onChange={handleChange}
          onNavigateToNote={handleNavigateToNote}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          sharedContext={sharedContext}
        />
      </main>
    </div>
  )
}
