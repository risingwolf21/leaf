import { NoteFolderPicker } from '@/components/NoteFolderPicker'
import { TagBar } from '@/components/TagBar'
import { formatRelativeTime } from '@/lib/utils'
import type { Note, Tag } from '@/types'

type NoteMetaRowProps = {
  note: Note
  tags: Tag[]
  allTags: Tag[]
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  onRemoveTag: (noteId: string, tagId: string) => Promise<void>
}

/** Row below the note title: relative date, folder picker, and the tag bar. */
export function NoteMetaRow({ note, tags, allTags, onAddTag, onRemoveTag }: NoteMetaRowProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs text-muted-foreground">
      <span title={`Created ${formatRelativeTime(note.created_at)}`}>{formatRelativeTime(note.updated_at)}</span>
      <span className="text-muted-foreground/40">·</span>
      <NoteFolderPicker note={note} />
      <span className="text-muted-foreground/40">·</span>
      <TagBar
        noteId={note.id}
        tags={tags}
        allTags={allTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        className="flex flex-1 flex-wrap items-center gap-1.5"
      />
    </div>
  )
}
