import { SharePanel } from '@/components/SharePanel'
import { EditorModeToggle } from '@/components/EditorModeToggle'
import { SaveAsTemplatePopover } from '@/components/SaveAsTemplatePopover'
import { ToolbarVisibilityToggle } from '@/components/editor/ToolbarVisibilityToggle'
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

/** Renders the note editor's app-bar actions: save status, sharing, mode toggles, and templating. */
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
    </>
  )
}
