import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ItemGroup } from '@/components/ui/item'
import { TagRow } from '@/components/sidebar/TagRow'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/lib/utils'

/** Collapsible sidebar section: alphabetical tag list (colour, name, count) that navigates like a folder on click. */
export function TagsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: tags = [], isLoading: tagsLoading } = useTags()


  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-accent/50 hover:text-foreground">
        <span className="flex-1 text-left">Tags</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {tagsLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading tags…</p>
        ) : (
          <ItemGroup className="gap-1 pr-2">
            {tags.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tags yet. Add #hashtags to your notes or use the tag button in the editor.
              </p>
            ) : (
              tags.map((tag) => <TagRow key={tag.id} tag={tag} />)
            )}
          </ItemGroup>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
