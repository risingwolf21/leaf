import { useCallback, useState } from 'react'
import { FolderPlus, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { NoteList } from '@/components/NoteList'
import { NoteEditor } from '@/components/NoteEditor'
import type { SharedContext } from '@/components/NoteEditor'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { SharePanel } from '@/components/SharePanel'
import { TemplatesView } from '@/components/TemplatesView'
import { TrashView } from '@/components/TrashView'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { FolderTree } from '@/components/FolderTree'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotes } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useSortPreference } from '@/hooks/useSortPreference'
import { useTemplates } from '@/hooks/useTemplates'
import { cn } from '@/lib/utils'
import type { AnyTemplate, Folder, Note, ViewMode } from '@/types'

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
  const { templates, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate } =
    useTemplates(createNote)
  const {
    sharedNotes,
    savingIds: sharedSavingIds,
    updateSharedNote,
    removeSelfFromNote,
  } = useSharedNotes()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('list')
  const [mode, setMode] = useState<ViewMode>('preview')
  const [selectedFolderId, setSelectedFolderId] = useState<FolderSelection>('all')
  const [versionHistoryNote, setVersionHistoryNote] = useState<Note | null>(null)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const ownActiveNote = notes.find((note) => note.id === activeNoteId) ?? null
  const sharedActiveNote = ownActiveNote
    ? null
    : sharedNotes.find((note) => note.id === activeNoteId) ?? null
  const activeNote: Note | null = ownActiveNote ?? sharedActiveNote
  const sharedContext: SharedContext | undefined = sharedActiveNote
    ? { role: sharedActiveNote.my_role }
    : undefined
  const handleChangeActiveNote = sharedContext ? updateSharedNote : updateNote
  const isSavingActive = activeNote
    ? (sharedContext ? sharedSavingIds : savingIds).has(activeNote.id)
    : false
  const currentFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id)
    setShowTrash(false)
    setShowTemplates(false)
    setMobileView('editor')
  }

  const handleSelectTrash = () => {
    setActiveNoteId(null)
    setShowTrash(true)
    setShowTemplates(false)
    setMobileView('editor')
  }

  const handleSelectTemplates = () => {
    setActiveNoteId(null)
    setShowTrash(false)
    setShowTemplates(true)
    setMobileView('editor')
  }

  const handleNavigateToNote = useCallback(
    (title: string) => {
      const target = notes.find((item) => item.title === title)
      if (!target) return
      setActiveNoteId(target.id)
      setShowTrash(false)
      setShowTemplates(false)
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
      setShowTemplates(false)
      setMobileView('editor')
    }
  }

  const handleSelectTemplate = async (template: AnyTemplate) => {
    const folderId = selectedFolderId === 'all' ? null : selectedFolderId
    const note = await createNoteFromTemplate(template, folderId)
    if (note) {
      setActiveNoteId(note.id)
      setShowTrash(false)
      setShowTemplates(false)
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

  const handleRemoveSharedNote = async (id: string) => {
    await removeSelfFromNote(id)
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
  const isReadOnlyActive = sharedContext?.role === 'viewer'

  const headerContent =
    activeNote && !showTrash && mobileView === 'editor' ? (
      <>
        <input
          value={activeNote.title}
          onChange={(e) => handleChangeActiveNote(activeNote.id, { title: e.target.value })}
          placeholder="Untitled"
          tabIndex={-1}
          readOnly={isReadOnlyActive}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        {!isReadOnlyActive && (
          <span
            className={cn(
              'shrink-0 text-xs',
              isSavingActive ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            {isSavingActive ? 'Saving…' : 'Saved'}
          </span>
        )}
        {!sharedContext && (
          <SharePanel note={activeNote} onShare={shareNote} onUnshare={unshareNote} onChange={updateNote} />
        )}
        {!isReadOnlyActive && <EditorModeToggle mode={mode} onModeChange={setMode} />}
        {!sharedContext && (
          <SaveAsTemplatePopover note={activeNote} onSaveAsTemplate={saveAsTemplate} />
        )}
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
          sharedNotes={sharedNotes}
          folders={folders}
          templates={templates}
          loading={loading}
          activeNoteId={activeNoteId}
          trashCount={trashedNotes.length}
          showTrash={showTrash}
          showTemplates={showTemplates}
          selectedFolderId={selectedFolderId}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSelectFolder={setSelectedFolderId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onSelectTemplate={handleSelectTemplate}
          onDeleteNote={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveNote={handleMoveNote}
          onSelectTrash={handleSelectTrash}
          onSelectTemplates={handleSelectTemplates}
          onTogglePin={togglePin}
          onShowVersionHistory={setVersionHistoryNote}
          onRemoveSharedNote={handleRemoveSharedNote}
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
        {showTemplates ? (
          <TemplatesView
            templates={templates}
            onUseTemplate={handleSelectTemplate}
            onSaveTemplate={saveAsTemplate}
            onRenameTemplate={renameTemplate}
            onDeleteTemplate={deleteTemplate}
          />
        ) : showTrash ? (
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
            isSaving={isSavingActive}
            mode={mode}
            onModeChange={setMode}
            onChange={handleChangeActiveNote}
            onNavigateToNote={handleNavigateToNote}
            onShare={shareNote}
            onUnshare={unshareNote}
            onSaveAsTemplate={saveAsTemplate}
            sharedContext={sharedContext}
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
