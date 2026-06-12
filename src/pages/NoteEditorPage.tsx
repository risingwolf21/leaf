import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { NoteEditor } from '@/components/NoteEditor'
import type { SharedContext } from '@/components/NoteEditor'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { SharePanel } from '@/components/SharePanel'
import { useNotesContext } from '@/context/NotesContext'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/types'

export default function NoteEditorPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const [mode, setMode] = useState<ViewMode>('preview')
  const {
    notes,
    sharedNotes,
    loading,
    sharedLoading,
    savingIds,
    sharedSavingIds,
    updateNote,
    updateSharedNote,
    shareNote,
    unshareNote,
    saveAsTemplate,
  } = useNotesContext()

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

  if (loading || sharedLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
          Loading notes…
        </div>
      </AppShell>
    )
  }

  if (!activeNote) {
    return <Navigate to="/app" replace />
  }

  const headerContent = (
    <>
      <input
        value={activeNote.title}
        onChange={(e) => handleChange(activeNote.id, { title: e.target.value })}
        placeholder="Untitled"
        tabIndex={-1}
        readOnly={isReadOnly}
        className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground"
      />
      {!isReadOnly && (
        <span className={cn('shrink-0 text-xs', isSaving ? 'text-muted-foreground' : 'text-primary')}>
          {isSaving ? 'Saving…' : 'Saved'}
        </span>
      )}
      {!sharedContext && (
        <SharePanel note={activeNote} onShare={shareNote} onUnshare={unshareNote} onChange={updateNote} />
      )}
      {!isReadOnly && <EditorModeToggle mode={mode} onModeChange={setMode} />}
      {!sharedContext && <SaveAsTemplatePopover note={activeNote} onSaveAsTemplate={saveAsTemplate} />}
    </>
  )

  return (
    <AppShell headerContent={headerContent}>
      <NoteEditor
        note={activeNote}
        notes={notes}
        isSaving={isSaving}
        mode={mode}
        onModeChange={setMode}
        onChange={handleChange}
        onNavigateToNote={handleNavigateToNote}
        onShare={shareNote}
        onUnshare={unshareNote}
        onSaveAsTemplate={saveAsTemplate}
        sharedContext={sharedContext}
      />
    </AppShell>
  )
}
