import { Card, CardContent } from '@/components/ui/card'
import { getPreviewText } from '@/lib/notePreview'
import { onActivateKey } from '@/lib/utils'
import type { Note } from '@/types'

type NoteGridCardProps = {
  note: Note
  onOpen: () => void
}

/** Grid-mode note tile: title plus a clamped plain-text preview of the content. */
export function NoteGridCard({ note, onOpen }: NoteGridCardProps) {
  const handleKeyDown = onActivateKey(onOpen)

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-colors hover:bg-accent"
    >
      <CardContent className="flex flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">{note.title || 'Untitled'}</span>
        <span className="line-clamp-3 text-xs text-muted-foreground">{getPreviewText(note.content)}</span>
      </CardContent>
    </Card>
  )
}
