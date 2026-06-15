import { useState } from 'react'
import type { MouseEvent } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { TagColorPicker } from '@/components/TagColorPicker'
import { RenameInput } from '@/components/sidebar/RenameInput'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { useDeleteTag } from '@/hooks/useDeleteTag'
import { useRenameTag } from '@/hooks/useRenameTag'
import { useUpdateTagColor } from '@/hooks/useUpdateTagColor'
import { useTagFilter } from '@/lib/sidebarStore'
import { onActivateKey } from '@/lib/utils'
import type { Tag } from '@/types'

/** A single tag row in the Tags panel: colour picker, name (or rename input), note count, and actions menu. */
export function TagRow({ tag }: { tag: Tag }) {
  const { tagFilter, toggleTagFilter } = useTagFilter()
  const updateTagColor = useUpdateTagColor()
  const deleteTag = useDeleteTag()
  const renameTag = useRenameTag()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(tag.name)

  const isActive = tagFilter.has(tag.id)
  const select = () => toggleTagFilter(tag.id)

  const startRename = () => {
    setRenameValue(tag.name)
    setIsRenaming(true)
  }

  const commitRename = () => {
    setIsRenaming(false)
    if (renameValue.trim()) renameTag.mutate({ id: tag.id, name: renameValue })
  }

  const stopRename = () => setIsRenaming(false)

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Remove this tag from all notes?')) deleteTag.mutate(tag.id)
  }

  return (
    <Item
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
          <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={stopRename} />
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
                    startRename()
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={handleDelete}
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
}
