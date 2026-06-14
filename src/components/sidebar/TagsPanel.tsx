import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { TagRow } from '@/components/sidebar/TagRow'
import { useNotes } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useTagFilter } from '@/lib/sidebarStore'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { onActivateKey } from '@/lib/utils'

/** Tags mode: alphabetical tag list (colour, name, count) that filters the Files tree on click. */
export function TagsPanel() {
  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const { data: notes = [] } = useNotes()
  const { tagFilter, toggleTagFilter } = useTagFilter()

  const untaggedCount = notes.filter((note) => note.tags.length === 0).length

  if (tagsLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Loading tags…</p>
  }

  return (
    <ItemGroup className="gap-1 p-2">
      {tags.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          No tags yet. Add #hashtags to your notes or use the tag button in the editor.
        </p>
      ) : (
        tags.map((tag) => <TagRow key={tag.id} tag={tag} />)
      )}

      <ItemSeparator />

      <Item
        variant={tagFilter.has(UNTAGGED_FILTER_ID) ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        aria-pressed={tagFilter.has(UNTAGGED_FILTER_ID)}
        onClick={() => toggleTagFilter(UNTAGGED_FILTER_ID)}
        onKeyDown={onActivateKey(() => toggleTagFilter(UNTAGGED_FILTER_ID))}
        className="cursor-pointer gap-2"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-muted-foreground" />
        <ItemContent>
          <ItemTitle>Untagged notes ({untaggedCount})</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  )
}
