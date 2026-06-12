import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import type { Note } from '@/types'

interface SaveAsTemplatePopoverProps {
  note: Note
  onSaveAsTemplate: (name: string, content: string) => Promise<void>
}

export function SaveAsTemplatePopover({ note, onSaveAsTemplate }: SaveAsTemplatePopoverProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(note.title || 'Untitled')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleOpenChange = (next: boolean) => {
    if (next) setName(note.title || 'Untitled')
    setOpen(next)
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    await onSaveAsTemplate(trimmed, note.content)
    setSaving(false)
    setOpen(false)
    toast({ description: 'Template saved.' })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Note actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="template-name" className="text-sm font-medium text-foreground">
              Template name
            </label>
            <Input
              id="template-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
