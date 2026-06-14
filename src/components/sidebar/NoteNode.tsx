import { FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { NoteActionsMenu } from '@/components/sidebar/NoteActionsMenu'
import { RenameInput } from '@/components/sidebar/RenameInput'
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useInlineRename } from '@/hooks/useInlineRename'
import { useUpdateNote } from '@/hooks/useNotes'
import type { NoteWithTags } from '@/types'

/** Renders a single note row with rename, pin, move, tag, share, and delete actions. */
export function NoteNode({ note }: { note: NoteWithTags }) {
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { noteId: activeNoteId } = useParams<{ noteId: string }>()
  const { updateNote } = useUpdateNote()
  const { isRenaming, value, setValue, startRename, stopRename } = useInlineRename(
    { kind: 'note', id: note.id },
    note.title
  )

  const isActive = activeNoteId === note.id

  const open = () => {
    navigate(`/app/notes/${note.id}`)
    setOpenMobile(false)
  }

  const commitRename = () => {
    stopRename()
    updateNote(note.id, { title: value.trim() })
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        className="data-active:bg-primary data-active:text-primary-foreground"
        render={isRenaming ? <div /> : undefined}
        onClick={isRenaming ? undefined : open}
      >
        <span className="size-4 shrink-0" />
        <FileText />
        {isRenaming ? (
          <RenameInput
            value={value}
            onChange={setValue}
            onCommit={commitRename}
            onCancel={stopRename}
            placeholder="Untitled"
          />
        ) : (
          <span className="truncate">{note.title || 'Untitled'}</span>
        )}
        {note.tags.length > 0 && !isRenaming && (
          <div
            className="flex shrink-0 items-center gap-0.5"
            title={note.tags.map((tag) => `#${tag.name}`).join(', ')}
          >
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </SidebarMenuButton>
      {!isRenaming && <NoteActionsMenu note={note} onOpen={open} onStartRename={startRename} />}
    </SidebarMenuItem>
  )
}
