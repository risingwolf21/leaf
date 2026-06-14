import { useState } from 'react'
import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Tag } from '@/types'

type TagPickerProps = {
  noteId: string
  noteTags: Tag[]
  allTags: Tag[]
  onAddTag: (noteId: string, tagName: string) => Promise<void>
  children: ReactElement
}

/** Inline popover for adding tags to a note: filter existing tags, or create a new one. */
export function TagPicker({ noteId, noteTags, allTags, onAddTag, children }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const noteTagIds = new Set(noteTags.map((tag) => tag.id))
  const normalized = query.trim().toLowerCase()
  const available = allTags
    .filter((tag) => !noteTagIds.has(tag.id))
    .filter((tag) => !normalized || tag.name.includes(normalized))

  const exactMatch = allTags.some((tag) => tag.name === normalized)
  const canCreate = normalized.length > 0 && !exactMatch

  const handleSelect = async (name: string) => {
    setQuery('')
    setOpen(false)
    await onAddTag(noteId, name)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setQuery('')
      }}
    >
      <PopoverTrigger render={children} />
      <PopoverContent align="start" className="w-56">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find or create a tag…"
          autoFocus
        />
        <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {available.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(tag.name)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
                aria-hidden="true"
              />
              <span className="truncate">#{tag.name}</span>
            </button>
          ))}
          {available.length === 0 && !canCreate && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {normalized ? 'No matching tags.' : 'No tags yet.'}
            </p>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={() => handleSelect(normalized)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Create tag &quot;#{normalized}&quot;</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
