import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { TrashView } from '@/components/TrashView'
import { useNotes } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { useSortPreference } from '@/hooks/useSortPreference'
import { cn } from '@/lib/utils'
import type { Note, ViewMode } from '@/types'

type MobileView = 'list' | 'editor'

export default function AppPage() {
  const [sortBy, setSortBy] = useSortPreference()
  const {
    notes,
    trashedNotes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    togglePin,
    savingIds,
    refetch,
  } = useNotes(sortBy)
  const { folders, createFolder, renameFolder, deleteFolder, moveNote } = useFolders()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [mode, setMode] = useState<ViewMode>('preview')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id)
    setShowTrash(false)
    setMobileView('editor')
  }

  const handleSelectTrash = () => {
    setActiveNoteId(null)
    setShowTrash(true)
    setMobileView('editor')
  }

  const handleCreateNote = async () => {
    const note = await createNote(currentFolderId)
    if (note) {
      setActiveNoteId(note.id)
      setShowTrash(false)
      setMobileView('editor')
    }
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
    if (activeNoteId === id) {
      setActiveNoteId(null)
      setMobileView('list')
    }
  }

  const handleCreateFolder = () => createFolder('New folder', currentFolderId)

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id)
    await refetch()
  }

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    await moveNote(noteId, folderId)
    await refetch()
  }

  const headerContent =
    activeNote && !showTrash && mobileView === 'editor' ? (
      <>
        <input
          value={activeNote.title}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          placeholder="Untitled"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <span
          className={cn(
            'shrink-0 text-xs',
            savingIds.has(activeNote.id) ? 'text-muted-foreground' : 'text-primary'
          )}
        >
          {savingIds.has(activeNote.id) ? 'Saving…' : 'Saved'}
        </span>
        <EditorModeToggle mode={mode} onModeChange={setMode} />
      </>
    ) : undefined

  return (
    <Layout
      showBackButton={mobileView === 'editor'}
      onBack={() => setMobileView('list')}
      headerContent={headerContent}
    >
      <aside
        className={cn(
          'h-full w-full shrink-0 overflow-hidden border-r border-border md:block md:w-[280px]',
          mobileView === 'editor' ? 'hidden' : 'block'
        )}
      >
        <NoteList
          notes={notes}
          folders={folders}
          loading={loading}
          activeNoteId={activeNoteId}
          trashCount={trashedNotes.length}
          showTrash={showTrash}
          currentFolderId={currentFolderId}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onNavigateFolder={setCurrentFolderId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNote={handleMoveNote}
          onSelectTrash={handleSelectTrash}
          onTogglePin={togglePin}
        />
      </aside>

      <main
        className={cn(
          'h-full min-w-0 flex-1 overflow-hidden',
          mobileView === 'list' ? 'hidden md:block' : 'block'
        )}
      >
        {showTrash ? (
          <TrashView
            notes={trashedNotes}
            onRestore={restoreNote}
            onPermanentlyDelete={permanentlyDeleteNote}
            onEmptyTrash={emptyTrash}
          />
        ) : activeNote ? (
          <NoteEditor
            note={activeNote}
            isSaving={savingIds.has(activeNote.id)}
            mode={mode}
            onModeChange={setMode}
            onChange={updateNote}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {loading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
          </div>
        )}
      </main>
    </Layout>
  )
}
