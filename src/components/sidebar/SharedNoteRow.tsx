import { Eye, MoreHorizontal, Pencil, UserX } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { useSidebar } from '@/components/ui/sidebar'
import { notePath } from '@/lib/routes'
import { cn, onActivateKey } from '@/lib/utils'
import type { SharedNote } from '@/types'

type SharedNoteRowProps = {
  note: SharedNote
  onRemove: (id: string) => void
}

/** A note shared with the current user by another owner, shown below the file tree. */
export function SharedNoteRow({ note, onRemove }: SharedNoteRowProps) {
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const isActive = activeNoteId === note.id
  const RoleIcon = note.my_role === 'editor' ? Pencil : Eye
  const roleLabel = note.my_role === 'editor' ? 'Can edit' : 'Can view'

  const open = () => {
    navigate(notePath(note.id, null, true))
    setOpenMobile(false)
  }

  const handleRemove = () => {
    if (window.confirm('Remove this note from your shared notes?')) {
      onRemove(note.id)
      if (isActive) navigate('/app')
    }
  }

  return (
    <Item
      size="sm"
      role="button"
      tabIndex={0}
      aria-current={isActive || undefined}
      onClick={open}
      onKeyDown={onActivateKey(open)}
      className={cn('group cursor-pointer gap-2', isActive && 'bg-primary text-primary-foreground')}
    >
      <span className="size-5 shrink-0" />
      <ItemContent>
        <ItemTitle className="truncate">{note.title || 'Untitled'}</ItemTitle>
        <ItemDescription className="flex items-center gap-1">
          <span title={roleLabel} className="shrink-0">
            <RoleIcon className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="truncate">{note.owner_email}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Note actions"
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
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove from shared
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  )
}
