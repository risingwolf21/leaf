import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { TagColorPicker } from '@/components/TagColorPicker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { useNotes } from '@/hooks/useNotes'
import { useDeleteTag, useRenameTag, useTags, useUpdateTagColor } from '@/hooks/useTags'
import { useTagFilter } from '@/lib/sidebarStore'
import { UNTAGGED_FILTER_ID } from '@/lib/tags'
import { onActivateKey } from '@/lib/utils'
import type { Tag } from '@/types'

/** Tags mode: alphabetical tag list (colour, name, count) that filters the Files tree on click. */
export function TagsPanel() {
  const { data: tags = [], isLoading: tagsLoading } = useTags()
  const { data: notes = [] } = useNotes()
  const { tagFilter, toggleTagFilter } = useTagFilter()
  const updateTagColor = useUpdateTagColor()
  const deleteTag = useDeleteTag()
  const renameTag = useRenameTag()
  const [renamingTagId, setRenamingTagId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const untaggedCount = notes.filter((note) => note.tags.length === 0).length

  const startRename = (tag: Tag) => {
    setRenamingTagId(tag.id)
    setRenameValue(tag.name)
  }

  const commitRename = (id: string) => {
    if (renameValue.trim()) renameTag.mutate({ id, name: renameValue })
    setRenamingTagId(null)
  }

  const cancelRename = () => setRenamingTagId(null)

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
        tags.map((tag) => {
          const isActive = tagFilter.has(tag.id)
          const isRenaming = renamingTagId === tag.id
          const select = () => toggleTagFilter(tag.id)

          return (
            <Item
              key={tag.id}
              variant={isActive ? 'muted' : 'default'}
              size="sm"
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => !isRenaming && select()}
              onKeyDown={onActivateKey(() => !isRenaming && select())}
              className="group cursor-pointer gap-2"
            >
              <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <TagColorPicker color={tag.color} onChange={(color) => updateTagColor.mutate({ id: tag.id, color })} />
              </span>
              <ItemContent>
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => commitRename(tag.id)}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') commitRename(tag.id)
                      if (e.key === 'Escape') cancelRename()
                    }}
                    className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                ) : (
                  <ItemTitle className="truncate">#{tag.name}</ItemTitle>
                )}
              </ItemContent>
              {!isRenaming && (
                <>
                  <span className="shrink-0 text-xs text-muted-foreground">{tag.note_count ?? 0}</span>
                  <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            aria-label="Tag actions"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            startRename(tag)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Remove this tag from all notes?')) deleteTag.mutate(tag.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete tag
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </>
              )}
            </Item>
          )
        })
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
