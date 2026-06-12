import { useCallback, useState } from 'react'
import { FolderPlus, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { SharePopover } from '@/components/SharePopover'
import { TrashView } from '@/components/TrashView'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { FolderTree } from '@/components/FolderTree'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotes } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { useSortPreference } from '@/hooks/useSortPreference'
import { cn } from '@/lib/utils'
import type { Folder, Note, ViewMode } from '@/types'

type MobileView = 'list' | 'editor'
type FolderSelection = string | 'all'

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
    shareNote,
    unshareNote,
    savingIds,
    refetch,
  } = useNotes(sortBy)
  const { folders, createFolder, renameFolder, deleteFolder, moveNote } = useFolders()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [mode, setMode] = useState<ViewMode>('preview')
  const [selectedFolderId, setSelectedFolderId] = useState<FolderSelection>('all')
  const [versionHistoryNote, setVersionHistoryNote] = useState<Note | null>(null)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null
  const currentFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null

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

  const handleNavigateToNote = useCallback(
    (title: string) => {
      const target = notes.find((item) => item.title === title)
      if (!target) return
      setActiveNoteId(target.id)
      setShowTrash(false)
      setMobileView('editor')
    },
    [notes]
  )

  const handleCreateNote = async () => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNote(folderId)
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

  const handleStartRename = (folder: Folder) => {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.name)
  }

  const handleCommitRename = (id: string) => {
    const name = renameValue.trim()
    if (name) renameFolder(id, name)
    setRenamingFolderId(null)
  }

  const handleCancelRename = () => setRenamingFolderId(null)

  const handleCreateFolder = async () => {
    const parentId = selectedFolderId === 'all' ? null : selectedFolderId
    const folder = await createFolder('New folder', parentId)
    if (folder) handleStartRename(folder)
  }

  const handleDeleteFolder = async (id: string) => {
    // Deletion cascades to subfolders; if the active selection points at the
    // deleted folder or one of its descendants, fall back to its parent (or
    // "All Notes" if it was a root folder) so the UI doesn't get stranded.
    const idsToRemove = new Set<string>()
    const collect = (folderId: string) => {
      idsToRemove.add(folderId)
      for (const folder of folders) {
        if (folder.parent_id === folderId) collect(folder.id)
      }
    }
    collect(id)

    if (selectedFolderId !== 'all' && idsToRemove.has(selectedFolderId)) {
      const deletedFolder = folders.find((folder) => folder.id === id)
      setSelectedFolderId(deletedFolder?.parent_id ?? 'all')
    }

    await deleteFolder(id)
    await refetch()
  }

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    await moveNote(noteId, folderId)
    await refetch()
  }

  const handleBack = () => {
    if (mobileView === 'editor') {
      setMobileView('list')
      return
    }
    if (currentFolder) {
      setSelectedFolderId(currentFolder.parent_id ?? 'all')
    }
  }

  const showBackButton = mobileView === 'editor' || currentFolder !== null

  const headerContent =
    activeNote && !showTrash && mobileView === 'editor' ? (
      <>
        <input
          value={activeNote.title}
          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
          placeholder="Untitled"
          tabIndex={-1}
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
        <SharePopover note={activeNote} onShare={shareNote} onUnshare={unshareNote} />
        <EditorModeToggle mode={mode} onModeChange={setMode} />
      </>
    ) : mobileView === 'list' && currentFolder ? (
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
    <Layout showBackButton={showBackButton} onBack={handleBack} headerContent={headerContent}>
      <aside className="hidden h-full w-60 shrink-0 overflow-hidden border-r border-border md:block">
        <ScrollArea className="h-full">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onDeleteFolder={handleDeleteFolder}
            renamingFolderId={renamingFolderId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onStartRename={handleStartRename}
            onCommitRename={handleCommitRename}
            onCancelRename={handleCancelRename}
          />
        </ScrollArea>
      </aside>

      <aside
        className={cn(
          'h-full w-full shrink-0 overflow-hidden border-r border-border md:block md:w-80',
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
          selectedFolderId={selectedFolderId}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSelectFolder={setSelectedFolderId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNote={handleMoveNote}
          onSelectTrash={handleSelectTrash}
          onTogglePin={togglePin}
          onShowVersionHistory={setVersionHistoryNote}
          renamingFolderId={renamingFolderId}
          renameValue={renameValue}
          onRenameValueChange={setRenameValue}
          onStartRename={handleStartRename}
          onCommitRename={handleCommitRename}
          onCancelRename={handleCancelRename}
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
            notes={notes}
            isSaving={savingIds.has(activeNote.id)}
            mode={mode}
            onModeChange={setMode}
            onChange={updateNote}
            onNavigateToNote={handleNavigateToNote}
            onShare={shareNote}
            onUnshare={unshareNote}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {loading ? 'Loading notes…' : 'Select a note or create a new one to get started.'}
          </div>
        )}
      </main>

      <VersionHistorySheet
        note={versionHistoryNote}
        onOpenChange={(open) => !open && setVersionHistoryNote(null)}
        updateNote={updateNote}
      />
    </Layout>
  )
}
