import { Plus, Tag as TagIcon, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TagPicker } from '@/components/TagPicker'
import type { Tag } from '@/types'

interface TagBarProps {
  noteId: string
  tags: Tag[]
  allTags: Tag[]
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  onRemoveTag: (noteId: string, tagId: string) => Promise<void>
  readOnly?: boolean
}

/** Tag chips row rendered below the note title, above the editor content. */
export function TagBar({ noteId, tags, allTags, onAddTag, onRemoveTag, readOnly = false }: TagBarProps) {
  if (readOnly && tags.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
      <TagIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="gap-1.5 pr-1">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: tag.color }}
            aria-hidden="true"
          />
          #{tag.name}
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRemoveTag(noteId, tag.id)}
              aria-label={`Remove tag ${tag.name}`}
              className="rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Badge>
      ))}
      {!readOnly && (
        <TagPicker noteId={noteId} noteTags={tags} allTags={allTags} onAddTag={onAddTag}>
          <button
            type="button"
            className="inline-flex h-5 items-center gap-1 rounded-4xl border border-dashed border-border px-2 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add tag
          </button>
        </TagPicker>
      )}
    </div>
  )
}
