import { NoteFolderPicker } from '@/components/NoteFolderPicker'
import { TagBar } from '@/components/TagBar'
import { formatRelativeTime } from '@/lib/utils'
import type { Note, Tag } from '@/types'
import { SharePanel } from './SharePanel'
import { useUnshareNote } from '@/hooks/useUnshareNote'
import { useShareNote } from '@/hooks/useShareNote'
import { queryClient } from '@/lib/queryClient'
import { tagsKeys } from '@/lib/queryKeys'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useAuth } from '@/hooks/useAuth'

type NoteMetaRowProps = {
  note: Note
  tags: Tag[]
  allTags: Tag[]
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  onRemoveTag: (noteId: string, tagId: string) => Promise<void>
}

/** Row below the note title: relative date, folder picker, and the tag bar. */
export function NoteMetaRow({ note, tags, allTags, onAddTag, onRemoveTag }: NoteMetaRowProps) {
  const { user } = useAuth()
  const shareNote = useShareNote()
  const unshareNote = useUnshareNote()
  const { updateNote } = useUpdateNote(() => {
    queryClient.invalidateQueries({ queryKey: tagsKeys.all(user?.id) })
  })


  const handleShare = async (id: string) => {
    const { url } = await shareNote.mutateAsync(id)
    return url
  }

  return (
    <div className="flex flex-row items-center justify-between border-b border-border ">
      <div className="flex flex-wrap items-center gap-2 pb-3 text-xs text-muted-foreground">
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
        <SharePanel note={note} onShare={handleShare} onUnshare={unshareNote.mutateAsync} onChange={updateNote} />
      </div>

    </div>
  )
}
