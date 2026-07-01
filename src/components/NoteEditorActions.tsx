import { MoreHorizontal, Pin, PinOff, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SharePanel } from '@/components/SharePanel'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { ToolbarVisibilityToggle } from '@/components/editor/ToolbarVisibilityToggle'
import { UNFILED_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDeleteNote } from '@/hooks/useDeleteNote'
import { useNotes } from '@/hooks/useNotes'
import { useSortPreference } from '@/hooks/useSortPreference'
import { useTogglePin } from '@/hooks/useTogglePin'
import { sortNotes } from '@/lib/notes'
import { cn } from '@/lib/utils'
import type { SharedContext } from '@/components/NoteEditor'
import type { Note, NoteFields, ViewMode } from '@/types'

type NoteEditorActionsProps = {
  note: Note
  sharedContext?: SharedContext
  isSaving: boolean
  isReadOnly: boolean
  isCollaborative: boolean
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  isToolbarVisible: boolean
  onToggleToolbar: () => void
  onShare: (id: string) => Promise<string>
  onUnshare: (id: string) => Promise<void>
  onChange: (id: string, fields: NoteFields) => void
  onSaveAsTemplate: (name: string, content: string) => Promise<void>
}

/** Renders the note editor's app-bar actions: save status, sharing, mode toggles, templating, and pin/delete. */
export function NoteEditorActions({
  note,
  sharedContext,
  isSaving,
  isReadOnly,
  isCollaborative,
  mode,
  onModeChange,
  isToolbarVisible,
  onToggleToolbar,
  onShare,
  onUnshare,
  onChange,
  onSaveAsTemplate,
}: NoteEditorActionsProps) {
  const navigate = useNavigate()
  const { data: notes = [] } = useNotes()
  const [sortBy] = useSortPreference()
  const togglePin = useTogglePin()
  const deleteNote = useDeleteNote()

  const handleDelete = () => {
    if (!window.confirm('Move this note to trash?')) return
    const siblings = sortNotes(
      notes.filter((sibling) => sibling.folder_id === note.folder_id && sibling.id !== note.id),
      sortBy
    )
    const fallbackPath = `/app/folders/${note.folder_id ?? UNFILED_FOLDER_ID}`
    navigate(siblings.length > 0 ? `/app/notes/${siblings[0].id}` : fallbackPath)
    deleteNote.mutate(note.id)
  }

  return (
    <>
      {!isReadOnly && (
        <span className={cn('shrink-0 text-xs', isSaving ? 'text-muted-foreground' : 'text-primary')}>
          {isSaving ? 'Saving…' : 'Saved'}
        </span>
      )}
      {!sharedContext && <SharePanel note={note} onShare={onShare} onUnshare={onUnshare} onChange={onChange} />}
      {!isReadOnly && mode === 'edit' && (
        <ToolbarVisibilityToggle isVisible={isToolbarVisible} onToggle={onToggleToolbar} />
      )}
      {!isReadOnly && <EditorModeToggle mode={mode} onModeChange={onModeChange} canUseRawModes={!isCollaborative} />}
      {!sharedContext && <SaveAsTemplatePopover note={note} onSaveAsTemplate={onSaveAsTemplate} />}
      {!sharedContext && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Pin or delete note">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => togglePin.mutate({ id: note.id, pinned: !note.pinned })}>
              {note.pinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin note
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin note
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Move to trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
