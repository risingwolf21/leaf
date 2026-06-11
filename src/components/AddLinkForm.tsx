import { useEffect, useState, type FormEvent, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { NoteLink } from '@/types'

export interface LinkFormValues {
  display_text: string
  url: string
  show_preview: boolean
}

interface AddLinkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLink: NoteLink | null
  anchorRef: RefObject<HTMLButtonElement>
  onSave: (values: LinkFormValues) => void
}

const URL_PATTERN = /^https?:\/\//i

export function AddLinkForm({ open, onOpenChange, editingLink, anchorRef, onSave }: AddLinkFormProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [displayText, setDisplayText] = useState('')
  const [url, setUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<{ display_text?: string; url?: string }>({})

  useEffect(() => {
    if (!open) return
    setDisplayText(editingLink?.display_text ?? '')
    setUrl(editingLink?.url ?? '')
    setShowPreview(editingLink?.show_preview ?? false)
    setErrors({})
  }, [open, editingLink])

  const handleUrlBlur = () => {
    const trimmed = url.trim()
    if (trimmed && !URL_PATTERN.test(trimmed)) {
      setUrl(`https://${trimmed}`)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const trimmedDisplayText = displayText.trim()
    const trimmedUrl = url.trim()

    const nextErrors: { display_text?: string; url?: string } = {}
    if (!trimmedDisplayText) nextErrors.display_text = 'Display text is required.'
    if (!trimmedUrl) nextErrors.url = 'URL is required.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const finalUrl = URL_PATTERN.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`

    onSave({ display_text: trimmedDisplayText, url: finalUrl, show_preview: showPreview })
    onOpenChange(false)
  }

  const title = editingLink ? 'Edit link' : 'Add link'

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-display-text" className="text-sm font-medium text-foreground">
          Display text
        </label>
        <Input
          id="link-display-text"
          value={displayText}
          onChange={(e) => setDisplayText(e.target.value)}
          placeholder="Enter a label for this link"
          aria-invalid={!!errors.display_text}
        />
        {errors.display_text && <p className="text-xs text-destructive">{errors.display_text}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-url" className="text-sm font-medium text-foreground">
          URL
        </label>
        <Input
          id="link-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://"
          aria-invalid={!!errors.url}
        />
        {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Show preview</p>
          <p className="text-xs text-muted-foreground">Fetch title, description and image from the page</p>
        </div>
        <Switch checked={showPreview} onCheckedChange={setShowPreview} aria-label="Show preview" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit">Save link</Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor virtualRef={anchorRef} />
        <PopoverContent
          align="end"
          className="w-80"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
          {formContent}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Save a web link to this note.</SheetDescription>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  )
}
