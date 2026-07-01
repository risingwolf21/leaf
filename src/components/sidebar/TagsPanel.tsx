import { useState } from 'react'
import { ChevronDown, Hash } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { TagRow } from '@/components/sidebar/TagRow'
import { useNotes } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useTagFilter } from '@/lib/sidebarStore'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { cn, onActivateKey } from '@/lib/utils'

/** Collapsible sidebar section: alphabetical tag list (colour, name, count) that filters the folder list on click. */
export function TagsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const { data: notes = [] } = useNotes()
  const { tagFilter, toggleTagFilter } = useTagFilter()

  const untaggedCount = notes.filter((note) => note.tags.length === 0).length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-accent/50 hover:text-foreground">
        <Hash className="h-3 w-3" />
        <span className="flex-1 text-left">Tags</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {tagsLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading tags…</p>
        ) : (
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
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
