import { FilterChip } from '@/components/sidebar/FilterChip'
import { NoteNode } from '@/components/sidebar/NoteNode'
import { sortNotes, useNotes, type SortBy } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useTagFilter } from '@/lib/sidebarStore'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'

/** Flat, filtered note list shown in Files mode when a tag (or "Untagged") filter is active. */
export function TagFilteredView({ sortBy }: { sortBy: SortBy }) {
  const { data: notes = [] } = useNotes()
  const { data: tags = [] } = useTags()
  const { tagFilter, toggleTagFilter } = useTagFilter()

  const filtered = tagFilter.has(UNTAGGED_FILTER_ID)
    ? notes.filter((note) => note.tags.length === 0)
    : notes.filter((note) => [...tagFilter].every((tagId) => note.tags.some((tag) => tag.id === tagId)))

  const sorted = sortNotes(filtered, sortBy)

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-center gap-1.5 px-2 pb-1 text-xs text-muted-foreground">
        <span className="shrink-0">Filtering by:</span>
        {tagFilter.has(UNTAGGED_FILTER_ID) ? (
          <FilterChip label="Untagged notes" onRemove={() => toggleTagFilter(UNTAGGED_FILTER_ID)} />
        ) : (
          [...tagFilter].map((tagId) => {
            const tag = tags.find((t) => t.id === tagId)
            if (!tag) return null
            return <FilterChip key={tagId} tag={tag} onRemove={() => toggleTagFilter(tagId)} />
          })
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notes match this filter.</p>
      ) : (
        sorted.map((note) => <NoteNode key={note.id} note={note} />)
      )}
    </div>
  )
}
