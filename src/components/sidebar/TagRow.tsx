import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { useActiveTag } from '@/hooks/useActiveTag'
import { useRenameTag } from '@/hooks/useRenameTag'
import { onActivateKey } from '@/lib/utils'
import type { Tag } from '@/types'
import { SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { Hash } from 'lucide-react'

/** A single tag row in the Tags panel: colour picker, name (or rename input), note count, and actions menu. */
export function TagRow({ tag }: { tag: Tag }) {
  const navigate = useNavigate()
  const { activeTagId } = useActiveTag()
  const renameTag = useRenameTag()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(tag.name)

  const isActive = activeTagId === tag.id
  const select = () => navigate(`/app/tags/${tag.id}`)

  const commitRename = () => {
    setIsRenaming(false)
    if (renameValue.trim()) renameTag.mutate({ id: tag.id, name: renameValue })
  }

  const stopRename = () => setIsRenaming(false)


  return (
    <SidebarMenuItem
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={() => !isRenaming && select()}
      onKeyDown={onActivateKey(() => !isRenaming && select())}
      className="group cursor-pointer"
    >
      <SidebarMenuButton>
        <div className="flex items-center justify-between w-full">
          {isRenaming ? (
            <RenameInput value={renameValue} onChange={setRenameValue} onCommit={commitRename} onCancel={stopRename} />
          ) : (
            <span className="flex items-center gap-1.5 truncate text-muted-foreground">
              <Hash className="w-5 h-5" />
              <span className="truncate">{tag.name}</span>
            </span>
          )}
        </div>
        {!isRenaming && (
          <>
            <span className="shrink-0 text-xs text-muted-foreground">{tag.note_count ?? 0}</span>

          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
