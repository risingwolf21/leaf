import { Tag as TagIcon } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { useAddTagToNote, useTags } from '@/hooks/useTags'
import type { NoteWithTags } from '@/types'

/** "Add tag" submenu listing tags not yet applied to `note`, each adding itself to the note on click. */
export function AddTagSubmenu({ note }: { note: NoteWithTags }) {
  const { data: tags = [] } = useTags()
  const addTagToNote = useAddTagToNote()

  const availableTags = tags.filter((tag) => !note.tags.some((t) => t.id === tag.id))

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <TagIcon className="mr-2 h-4 w-4" />
        Add tag
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {availableTags.length === 0 ? (
          <DropdownMenuItem disabled>No tags to add</DropdownMenuItem>
        ) : (
          availableTags.map((tag) => (
            <DropdownMenuItem
              key={tag.id}
              onClick={() => addTagToNote.mutate({ noteId: note.id, tagName: tag.name })}
            >
              <span
                className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden="true"
              />
              #{tag.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
