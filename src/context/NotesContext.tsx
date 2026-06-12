import { createContext, useCallback, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import type { NoteFields, SortBy } from '@/hooks/useNotes'
import { useFolders } from '@/hooks/useFolders'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useTags } from '@/hooks/useTags'
import { useTemplates } from '@/hooks/useTemplates'
import { useSortPreference } from '@/hooks/useSortPreference'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import type { AnyTemplate, Folder, Note, NoteWithTags, SharedNote, Tag, Template } from '@/types'

export type FolderSelection = string | 'all'

interface NotesContextValue {
  notes: NoteWithTags[]
  trashedNotes: Note[]
  loading: boolean
  createNote: (folderId?: string | null, fields?: NoteFields) => Promise<NoteWithTags | null>
  updateNote: (id: string, fields: NoteFields) => void
  deleteNote: (id: string) => Promise<void>
  restoreNote: (id: string) => Promise<void>
  permanentlyDeleteNote: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  togglePin: (id: string, pinned: boolean) => Promise<void>
  shareNote: (id: string) => Promise<string>
  unshareNote: (id: string) => Promise<void>
  savingIds: Set<string>
  refetch: () => Promise<void>

  tags: Tag[]
  tagsLoading: boolean
  updateTagColor: (id: string, color: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  getNotesForTag: (tagId: string) => Promise<Note[]>
  addTagToNote: (noteId: string, tagName: string) => Promise<void>
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>

  folders: Folder[]
  selectedFolderId: FolderSelection
  setSelectedFolderId: (id: FolderSelection) => void
  currentFolder: Folder | null
  renamingFolderId: string | null
  renameValue: string
  setRenameValue: (value: string) => void
  handleStartRename: (folder: Folder) => void
  handleCommitRename: (id: string) => void
  handleCancelRename: () => void
  handleCreateFolder: () => Promise<void>
  handleDeleteFolder: (id: string) => Promise<void>
  handleMoveNote: (noteId: string, folderId: string | null) => Promise<void>

  templates: Template[]
  saveAsTemplate: (name: string, content: string) => Promise<void>
  renameTemplate: (id: string, name: string) => void
  deleteTemplate: (id: string) => void
  createNoteFromTemplate: (template: AnyTemplate, folderId?: string | null) => Promise<Note | null>

  sharedNotes: SharedNote[]
  sharedLoading: boolean
  sharedSavingIds: Set<string>
  updateSharedNote: (id: string, fields: NoteFields) => void
  removeSelfFromNote: (id: string) => Promise<void>

  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void

  versionHistoryNote: Note | null
  openVersionHistory: (note: Note) => void
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function useNotesContext() {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotesContext must be used within a NotesProvider')
  return context
}

/**
 * Layout-route provider for everything under `/app`: owns the notes/folders/
 * templates/shared-notes data plus cross-cutting UI state (folder selection,
 * folder rename, version history) that must survive navigation between the
 * note list, editor, trash and templates routes.
 */
export function NotesProvider() {
  const [sortBy, setSortBy] = useSortPreference()
  const {
    tags,
    loading: tagsLoading,
    updateTagColor,
    deleteTag,
    getNotesForTag,
    addTagToNote: addTagLink,
    removeTagFromNote: removeTagLink,
    refetch: refetchTags,
  } = useTags()
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
    setNoteTags,
    savingIds,
    refetch,
  } = useNotes(sortBy, refetchTags)
  const { folders, createFolder, renameFolder, deleteFolder, moveNote } = useFolders()
  const { templates, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate } =
    useTemplates(createNote)
  const {
    sharedNotes,
    loading: sharedLoading,
    savingIds: sharedSavingIds,
    updateSharedNote,
    removeSelfFromNote,
  } = useSharedNotes()

  const [selectedFolderId, setSelectedFolderId] = useState<FolderSelection>('all')
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [versionHistoryNote, setVersionHistoryNote] = useState<Note | null>(null)

  const currentFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null

  const handleStartRename = useCallback((folder: Folder) => {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.name)
  }, [])

  const handleCommitRename = useCallback(
    (id: string) => {
      const name = renameValue.trim()
      if (name) renameFolder(id, name)
      setRenamingFolderId(null)
    },
    [renameValue, renameFolder]
  )

  const handleCancelRename = useCallback(() => setRenamingFolderId(null), [])

  const handleCreateFolder = useCallback(async () => {
    const parentId = selectedFolderId === 'all' ? null : selectedFolderId
    const folder = await createFolder('New folder', parentId)
    if (folder) handleStartRename(folder)
  }, [selectedFolderId, createFolder, handleStartRename])

  const handleDeleteFolder = useCallback(
    async (id: string) => {
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
    },
    [folders, selectedFolderId, deleteFolder, refetch]
  )

  const handleMoveNote = useCallback(
    async (noteId: string, folderId: string | null) => {
      await moveNote(noteId, folderId)
      await refetch()
    },
    [moveNote, refetch]
  )

  const addTagToNote = useCallback(
    async (noteId: string, tagName: string) => {
      const tag = await addTagLink(noteId, tagName)
      if (!tag) return

      const note = notes.find((n) => n.id === noteId)
      if (!note || note.tags.some((t) => t.id === tag.id)) return

      setNoteTags(noteId, [...note.tags, tag])
    },
    [addTagLink, notes, setNoteTags]
  )

  const removeTagFromNote = useCallback(
    async (noteId: string, tagId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (note) setNoteTags(noteId, note.tags.filter((t) => t.id !== tagId))

      await removeTagLink(noteId, tagId)
    },
    [notes, setNoteTags, removeTagLink]
  )

  const openVersionHistory = useCallback((note: Note) => setVersionHistoryNote(note), [])

  const value: NotesContextValue = {
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

    tags,
    tagsLoading,
    updateTagColor,
    deleteTag,
    getNotesForTag,
    addTagToNote,
    removeTagFromNote,

    folders,
    selectedFolderId,
    setSelectedFolderId,
    currentFolder,
    renamingFolderId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
    handleCreateFolder,
    handleDeleteFolder,
    handleMoveNote,

    templates,
    saveAsTemplate,
    renameTemplate,
    deleteTemplate,
    createNoteFromTemplate,

    sharedNotes,
    sharedLoading,
    sharedSavingIds,
    updateSharedNote,
    removeSelfFromNote,

    sortBy,
    setSortBy,

    versionHistoryNote,
    openVersionHistory,
  }

  return (
    <NotesContext.Provider value={value}>
      <Outlet />
      <VersionHistorySheet
        note={versionHistoryNote}
        onOpenChange={(open) => !open && setVersionHistoryNote(null)}
        updateNote={updateNote}
      />
    </NotesContext.Provider>
  )
}
