import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import type { NoteFields, SortBy } from '@/hooks/useNotes'
import { useCollapsedFolders } from '@/hooks/useCollapsedFolders'
import { getFolderAncestorChain, useFolders } from '@/hooks/useFolders'
import { useSharedNotes } from '@/hooks/useSharedNotes'
import { useTags } from '@/hooks/useTags'
import { useTemplates } from '@/hooks/useTemplates'
import { useSortPreference } from '@/hooks/useSortPreference'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import type { AnyTemplate, Folder, Note, NoteWithTags, SharedNote, Tag, Template } from '@/types'

export type SidebarMode = 'files' | 'search' | 'tags'

const SIDEBAR_STORAGE_KEY = 'leaf-sidebar'

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
  renameTag: (id: string, name: string) => Promise<void>
  getNotesForTag: (tagId: string) => Promise<Note[]>
  addTagToNote: (noteId: string, tagName: string) => Promise<void>
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>

  folders: Folder[]
  /** The active note's `folder_id`, or `null` if no note is open / it's unfiled. Used as the target folder for "new note", "new folder", etc. */
  activeFolderId: string | null
  /** `activeFolderId` plus all of its ancestors, for auto-expanding the sidebar tree to reveal the active note. */
  autoExpandedFolderIds: Set<string>
  renamingFolderId: string | null
  renameValue: string
  setRenameValue: (value: string) => void
  handleStartRename: (folder: Folder) => void
  handleCommitRename: (id: string) => void
  handleCancelRename: () => void
  handleCreateFolder: () => Promise<void>
  handleCreateSubfolder: (parentId: string) => Promise<void>
  handleDeleteFolder: (id: string) => Promise<void>
  handleMoveNote: (noteId: string, folderId: string | null) => Promise<void>
  moveFolder: (folderId: string, newParentId: string | null) => Promise<void>

  renamingNoteId: string | null
  noteRenameValue: string
  setNoteRenameValue: (value: string) => void
  handleStartNoteRename: (note: Note) => void
  handleCommitNoteRename: (id: string) => void
  handleCancelNoteRename: () => void

  collapsedFolderIds: Set<string>
  toggleFolderCollapsed: (id: string) => void

  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  sidebarOpen: boolean
  toggleSidebar: () => void

  tagFilter: Set<string>
  toggleTagFilter: (tagId: string) => void
  clearTagFilter: () => void

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
 * folder/note rename, sidebar mode/collapse, tag filter, version history)
 * that must survive navigation between the note list, editor, trash and
 * templates routes.
 */
export function NotesProvider() {
  const [sortBy, setSortBy] = useSortPreference()
  const {
    tags,
    loading: tagsLoading,
    updateTagColor,
    deleteTag,
    renameTag,
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
  const { folders, createFolder, renameFolder, deleteFolder, moveNote, moveFolder } = useFolders()
  const { templates, saveAsTemplate, renameTemplate, deleteTemplate, createNoteFromTemplate } =
    useTemplates(createNote)
  const {
    sharedNotes,
    loading: sharedLoading,
    savingIds: sharedSavingIds,
    updateSharedNote,
    removeSelfFromNote,
  } = useSharedNotes()
  const { collapsedFolderIds, toggleFolderCollapsed } = useCollapsedFolders()
  const { noteId } = useParams<{ noteId?: string }>()

  const activeFolderId = notes.find((note) => note.id === noteId)?.folder_id ?? null
  const autoExpandedFolderIds = useMemo(
    () => new Set(getFolderAncestorChain(activeFolderId, folders)),
    [activeFolderId, folders]
  )

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [noteRenameValue, setNoteRenameValue] = useState('')
  const [versionHistoryNote, setVersionHistoryNote] = useState<Note | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('files')
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpenState] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'closed'
  )

  const toggleSidebar = useCallback(() => {
    setSidebarOpenState((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'open' : 'closed')
      return next
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar])

  const toggleTagFilter = useCallback((tagId: string) => {
    setTagFilter((prev) => {
      if (tagId === UNTAGGED_FILTER_ID) {
        return prev.has(UNTAGGED_FILTER_ID) ? new Set() : new Set([UNTAGGED_FILTER_ID])
      }

      const next = new Set(prev)
      next.delete(UNTAGGED_FILTER_ID)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }, [])

  const clearTagFilter = useCallback(() => setTagFilter(new Set()), [])

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
    const folder = await createFolder('New folder', activeFolderId)
    if (folder) handleStartRename(folder)
  }, [activeFolderId, createFolder, handleStartRename])

  const handleCreateSubfolder = useCallback(
    async (parentId: string) => {
      const folder = await createFolder('New folder', parentId)
      if (folder) handleStartRename(folder)
    },
    [createFolder, handleStartRename]
  )

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      await deleteFolder(id)
      await refetch()
    },
    [deleteFolder, refetch]
  )

  const handleMoveNote = useCallback(
    async (noteId: string, folderId: string | null) => {
      await moveNote(noteId, folderId)
      await refetch()
    },
    [moveNote, refetch]
  )

  const handleStartNoteRename = useCallback((note: Note) => {
    setRenamingNoteId(note.id)
    setNoteRenameValue(note.title)
  }, [])

  const handleCommitNoteRename = useCallback(
    (id: string) => {
      updateNote(id, { title: noteRenameValue.trim() })
      setRenamingNoteId(null)
    },
    [noteRenameValue, updateNote]
  )

  const handleCancelNoteRename = useCallback(() => setRenamingNoteId(null), [])

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
    renameTag,
    getNotesForTag,
    addTagToNote,
    removeTagFromNote,

    folders,
    activeFolderId,
    autoExpandedFolderIds,
    renamingFolderId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
    handleCreateFolder,
    handleCreateSubfolder,
    handleDeleteFolder,
    handleMoveNote,
    moveFolder,

    renamingNoteId,
    noteRenameValue,
    setNoteRenameValue,
    handleStartNoteRename,
    handleCommitNoteRename,
    handleCancelNoteRename,

    collapsedFolderIds,
    toggleFolderCollapsed,

    sidebarMode,
    setSidebarMode,
    sidebarOpen,
    toggleSidebar,

    tagFilter,
    toggleTagFilter,
    clearTagFilter,

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
