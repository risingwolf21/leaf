import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { NoteEditor } from '@/components/NoteEditor'
import type { SharedContext } from '@/components/NoteEditor'
import { NoteEditorActions } from '@/components/NoteEditorActions'
import { EditorToolbarContainer } from '@/components/editor/EditorToolbarContainer'
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
import { useNoteCollaboration } from '@/hooks/useNoteCollaboration'
import { useToolbarVisibility } from '@/hooks/useToolbarVisibility'
import { useSetAppBar } from '@/lib/appBarStore'
import { tagsKeys } from '@/lib/queryKeys'
import { notePath } from '@/lib/routes'
import type { ViewMode } from '@/types'

export default function NoteEditorPage() {
  const { noteId } = useParams<{ noteId: string; folderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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

  const { collaboration } = useNoteCollaboration(activeNote, !!sharedContext, user)

  const handleNavigateToNote = useCallback(
    (title: string) => {
      const target = notes.find((item) => item.title === title)
      if (target) navigate(notePath(target.id, target.folder_id))
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

  // useSetAppBar({
  //   primaryAction: isMobile ? 'back' : 'default',
  //   navigateBackPath: `/app/folders/${routeFolderId}`,
  //   bottomContent: !isReadOnly && mode === 'edit' && isToolbarVisible ? <EditorToolbarContainer /> : null,
  //   actions: activeNote ? (
  //     <NoteEditorActions
  //       note={activeNote}
  //       sharedContext={sharedContext}
  //       isSaving={isSaving}
  //       isReadOnly={isReadOnly}
  //       isCollaborative={isCollaborative}
  //       mode={mode}
  //       onModeChange={setMode}
  //       isToolbarVisible={isToolbarVisible}
  //       onToggleToolbar={toggleToolbar}
  //       onShare={handleShare}
  //       onUnshare={unshareNote.mutateAsync}
  //       onChange={updateNote}
  //       onSaveAsTemplate={handleSaveAsTemplate}
  //     />
  //   ) : null,
  // })

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
    <div className='scrollbar-thin h-full min-h-0 overflow-x-hidden overflow-y-auto pb-safe-bottom'>
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
        collaboration={collaboration}
      />
    </div>
  )
}
