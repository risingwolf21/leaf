import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'
import { TrashView } from '@/components/TrashView'
import { useNotes } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

type MobileView = 'list' | 'editor'

export default function AppPage() {
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
    savingIds,
    refetch,
  } = useNotes()
  const { folders, createFolder, renameFolder, deleteFolder, moveNote } = useFolders()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('list')

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
    const note = await createNote()
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

  const handleCreateFolder = () => createFolder('New folder')

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id)
    await refetch()
  }

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    await moveNote(noteId, folderId)
    await refetch()
  }

  return (
    <Layout showBackButton={mobileView === 'editor'} onBack={() => setMobileView('list')}>
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
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNote={handleMoveNote}
          onSelectTrash={handleSelectTrash}
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
