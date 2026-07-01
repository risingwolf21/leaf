import { MoreHorizontal, Pin } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoteActionsMenu } from '@/components/sidebar/NoteActionsMenu'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { Item, ItemActions, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '@/components/ui/item'
import { useInlineRename } from '@/hooks/useInlineRename'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { getPreviewText } from '@/lib/notePreview'
import { cn, formatRelativeTime, onActivateKey } from '@/lib/utils'
import type { NoteWithTags } from '@/types'

type NoteListRowProps = {
  note: NoteWithTags
}

/** Desktop note-list row: title + timestamp on one line, a preview below, up to 2 tags, and a hover actions menu. */
export function NoteListRow({ note }: NoteListRowProps) {
  const navigate = useNavigate()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { updateNote } = useUpdateNote()
  const { isRenaming, value, setValue, startRename, stopRename } = useInlineRename(
    { kind: 'note', id: note.id },
    note.title
  )

  const isActive = activeNoteId === note.id
  const open = () => navigate(`/app/notes/${note.id}`)

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
        <ItemHeader>
          <ItemTitle className="min-w-0 flex-1">
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
          <ItemDescription className="shrink-0">{formatRelativeTime(note.updated_at)}</ItemDescription>
        </ItemHeader>
        <ItemDescription className="truncate">{getPreviewText(note.content)}</ItemDescription>
        {note.tags.length > 0 && (
          <div className="flex items-center gap-2 font-tag text-xs text-muted-foreground/70">
            {note.tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="truncate">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
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
