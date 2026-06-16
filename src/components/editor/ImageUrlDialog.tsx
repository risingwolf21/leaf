import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Mirrors the paste-rule regex — covers common image extensions with optional query strings.
const IMAGE_URL_REGEX = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?$/i

type ImageUrlDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editor: Editor
}

export function ImageUrlDialog({ open, onOpenChange, editor }: ImageUrlDialogProps) {
  const [url, setUrl] = useState('')
  const [hasError, setHasError] = useState(false)

  const isValidUrl = IMAGE_URL_REGEX.test(url.trim())

  const handleInsert = () => {
    if (!isValidUrl) return
    editor.chain().focus().setImage({ src: url.trim(), alt: '' }).run()
    // Reset and close after insert
    setUrl('')
    setHasError(false)
    onOpenChange(false)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUrl('')
      setHasError(false)
    }
    onOpenChange(nextOpen)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    // Clear error once the user starts correcting the input
    if (hasError) setHasError(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isValidUrl) {
        handleInsert()
      } else {
        setHasError(true)
      }
    }
  }

  const showPreview = url.trim().length > 0 && isValidUrl

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader showCloseButton>
          <DialogTitle>Insert image from URL</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 pb-2">
          <Input
            placeholder="https://example.com/image.png"
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            aria-invalid={hasError}
            autoFocus
          />

          {showPreview && (
            <div className="flex justify-center rounded-md border border-border bg-muted/40 p-2">
              {/* onError lets the preview fail silently if the URL is unreachable */}
              <img
                src={url.trim()}
                alt="Preview"
                className="max-h-40 max-w-full rounded object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}

          {hasError && (
            <p className="text-sm text-destructive">
              Please enter a valid image URL ending in .png, .jpg, .gif, .webp, or .svg.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!isValidUrl}
          >
            Insert image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
