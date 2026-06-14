import { X } from 'lucide-react'
import type { Tag } from '@/types'

type FilterChipProps = {
  label?: string
  tag?: Tag
  onRemove: () => void
}

/** Pill showing an active tag (or "Untagged") filter, with a button to clear it. */
export function FilterChip({ label, tag, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
      {tag && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden="true" />
      )}
      <span className="truncate">{tag ? tag.name : label}</span>
      <button
        type="button"
        aria-label={`Remove ${tag ? tag.name : label} filter`}
        onClick={onRemove}
        className="rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
