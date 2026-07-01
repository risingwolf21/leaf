import { MoreHorizontal, Pin } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoteActionsMenu } from '@/components/sidebar/NoteActionsMenu'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { useInlineRename } from '@/hooks/useInlineRename'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { getPreviewText } from '@/lib/notePreview'
import { notePath } from '@/lib/routes'
import { cn, formatRelativeTime, onActivateKey } from '@/lib/utils'
import type { NoteWithTags } from '@/types'

type NoteListRowProps = {
  note: NoteWithTags
}

/** Desktop note-list row: title on its own line, a 2-line preview, and a meta row combining relative date + up to 2 tags. */
export function NoteListRow({ note }: NoteListRowProps) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { updateNote } = useUpdateNote()
  const { isRenaming, value, setValue, startRename, stopRename } = useInlineRename(
    { kind: 'note', id: note.id },
    note.title
  )

  const isActive = activeNoteId === note.id
  const open = () => navigate(notePath(note.id, note.folder_id))

  const commitRename = () => {
    stopRename()
    updateNote(note.id, { title: value.trim() })
  }

  return (
    <Item
      role="button"
      tabIndex={0}
      onClick={isRenaming ? undefined : open}
      onKeyDown={isRenaming ? undefined : onActivateKey(open)}
      className={cn(
        'group cursor-pointer gap-2 rounded-none border-x-0 border-t-0 border-b border-border',
        isActive && 'bg-secondary'
      )}
    >
      <ItemContent className="min-w-0">
        <ItemTitle className="min-w-0">
          {note.pinned && <Pin className="h-3 w-3 shrink-0 fill-current text-primary" />}
          {isRenaming ? (
            <RenameInput
              value={value}
              onChange={setValue}
              onCommit={commitRename}
              onCancel={stopRename}
              placeholder="Untitled"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{note.title || 'Untitled'}</span>
          )}
        </ItemTitle>
        <ItemDescription>{getPreviewText(note.content)}</ItemDescription>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
          <span className="shrink-0 tabular-nums">{formatRelativeTime(note.updated_at)}</span>
          {note.tags.slice(0, 2).map((tag) => (
            <span key={tag.id} className="truncate font-tag text-muted-foreground/60">
              #{tag.name}
            </span>
          ))}
        </div>
      </ItemContent>
      {!isRenaming && (
        <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <NoteActionsMenu
            note={note}
            onOpen={open}
            onStartRename={startRename}
            trigger={
              <button
                type="button"
                aria-label="Note actions"
                onClick={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          />
        </ItemActions>
      )}
    </Item>
  )
}
