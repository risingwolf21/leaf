import { Folder } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useFolders } from '@/hooks/useFolders'
import { flattenFolders, INDENT_REM } from '@/lib/folderTree'

const UNFILED_VALUE = 'Unfiled'

type NewNoteModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Folder pre-selected when the modal opens, e.g. the currently active folder. */
  defaultFolderId?: string | null
}

/** Modal for creating a note with an explicit title and folder, alongside the existing instant-create flows. */
export function NewNoteModal({ open, onOpenChange, defaultFolderId = null }: NewNoteModalProps) {
  const navigate = useNavigate()
  const { data: folders = [] } = useFolders()
  const createNote = useCreateNote()
  const [title, setTitle] = useState('')
  const [folderValue, setFolderValue] = useState(defaultFolderId ?? UNFILED_VALUE)

  const folderTargets = flattenFolders(folders)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle('')
      setFolderValue(defaultFolderId ?? UNFILED_VALUE)
    }
    onOpenChange(nextOpen)
  }

  const handleCreate = () => {
    const folderId = folderValue === UNFILED_VALUE ? null : folderValue
    createNote.mutate(
      { folderId, fields: { title: title.trim() || undefined } },
      {
        onSuccess: (note) => {
          onOpenChange(false)
          navigate(`/app/notes/${note.id}`)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 rounded-xl border border-border bg-card p-0 shadow-xl ring-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-xl font-medium">New note</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-6">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Untitled"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Select value={folderValue} onValueChange={(value) => setFolderValue(value ?? UNFILED_VALUE)}>
            <SelectTrigger className="w-full">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNFILED_VALUE}>Unfiled</SelectItem>
              {folderTargets.map(({ folder, depth }) => (
                <SelectItem
                  key={folder.id}
                  value={folder.id}
                  style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
                >
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
