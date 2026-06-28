import { FileText, FolderPlus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCreateFolder } from '@/hooks/useCreateFolder'
import { useCreateNote } from '@/hooks/useCreateNote'

type FolderCreateMenuProps = {
  folderId: string | null
}

/** Floating "+" button for creating a note or folder inside the folder currently being browsed. */
export function FolderCreateMenu({ folderId }: FolderCreateMenuProps) {
  const navigate = useNavigate()
  const createNote = useCreateNote()
  const createFolder = useCreateFolder()

  const handleCreateNote = () => {
    createNote.mutate({ folderId }, { onSuccess: (note) => navigate(`/app/notes/${note.id}`) })
  }

  const handleCreateFolder = () => {
    createFolder.mutate({ name: 'New folder', parentId: folderId })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            aria-label="Create note or folder"
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCreateNote}>
          <FileText className="mr-2 h-4 w-4" />
          New note
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCreateFolder}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
