import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { getPreviewText } from '@/lib/notePreview'
import { formatRelativeTime, onActivateKey } from '@/lib/utils'
import type { Note } from '@/types'

type NoteListRowProps = {
  note: Note
  onOpen: () => void
}

/** List-mode note row: title, a one-line plain-text preview, and a relative timestamp. */
export function NoteListRow({ note, onOpen }: NoteListRowProps) {
  const handleKeyDown = onActivateKey(onOpen)

  return (
    <Item role="button" tabIndex={0} onClick={onOpen} onKeyDown={handleKeyDown} className="cursor-pointer gap-2">
      <ItemContent>
        <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
        <ItemDescription className="truncate">{getPreviewText(note.content)}</ItemDescription>
        <ItemDescription>{formatRelativeTime(note.updated_at)}</ItemDescription>
      </ItemContent>
    </Item>
  )
}
