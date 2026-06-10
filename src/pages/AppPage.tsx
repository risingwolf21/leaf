import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'
import { useNotes } from '@/hooks/useNotes'
import { cn } from '@/lib/utils'
import type { Note } from '@/types'

type MobileView = 'list' | 'editor'

export default function AppPage() {
  const { notes, loading, createNote, updateNote, deleteNote, savingIds } = useNotes()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<MobileView>('list')

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id)
    setMobileView('editor')
  }

  const handleCreateNote = async () => {
    const note = await createNote()
    if (note) {
      setActiveNoteId(note.id)
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
          loading={loading}
          activeNoteId={activeNoteId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      </aside>

      <main
        className={cn(
          'h-full min-w-0 flex-1 overflow-hidden',
          mobileView === 'list' ? 'hidden md:block' : 'block'
        )}
      >
        {activeNote ? (
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
