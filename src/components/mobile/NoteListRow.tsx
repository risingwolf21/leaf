import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '@/components/ui/item'
import { getPreviewText } from '@/lib/notePreview'
import { formatRelativeTime, onActivateKey } from '@/lib/utils'
import type { Note } from '@/types'

type NoteListRowProps = {
  note: Note
  onOpen: () => void
}

/** List-mode note row: title + relative timestamp on one line, a one-line plain-text preview below. */
export function NoteListRow({ note, onOpen }: NoteListRowProps) {
  const handleKeyDown = onActivateKey(onOpen)

  return (
    <Item
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="cursor-pointer gap-2 rounded-none border-x-0 border-t-0 border-b border-border"
    >
      <ItemContent className="min-w-0">
        <ItemHeader>
          <ItemTitle className="min-w-0 flex-1 truncate">{note.title || 'Untitled'}</ItemTitle>
          <ItemDescription className="shrink-0">{formatRelativeTime(note.updated_at)}</ItemDescription>
        </ItemHeader>
        <ItemDescription className="truncate">{getPreviewText(note.content)}</ItemDescription>
      </ItemContent>
    </Item>
  )
}
