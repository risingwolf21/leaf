import { FolderPlus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { useNotesContext } from '@/context/NotesContext'

export default function NoteListPage() {
  const navigate = useNavigate()
  const { currentFolder, loading, selectedFolderId, createNote, handleCreateFolder } = useNotesContext()

  const handleCreateNote = async () => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNote(folderId)
    if (note) navigate(`/app/notes/${note.id}`)
  }

  const headerContent = currentFolder ? (
    <>
      <span className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
        {currentFolder.name}
      </span>
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <Button variant="ghost" size="icon" onClick={handleCreateNote} aria-label="New note">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCreateFolder} aria-label="New folder">
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>
    </>
  ) : undefined

  return (
    <AppShell headerContent={headerContent}>
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        {loading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
      </div>
    </AppShell>
  )
}
