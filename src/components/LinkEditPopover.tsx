import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { getMarkRange } from '@tiptap/core'
import { Link as LinkIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Toggle } from '@/components/ui/toggle'

interface LinkEditPopoverProps {
  editor: Editor
}

export function LinkEditPopover({ editor }: LinkEditPopoverProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const { state } = editor
      const { $from, from, to, empty } = state.selection
      const range = editor.isActive('link')
        ? getMarkRange($from, state.schema.marks.link)
        : !empty
          ? { from, to }
          : null

      setText(range ? state.doc.textBetween(range.from, range.to) : '')
      setUrl(editor.isActive('link') ? (editor.getAttributes('link').href as string) ?? '' : '')
    }
    setOpen(next)
  }

  const applyLink = () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return

    const { state } = editor
    const { $from, from, to, empty } = state.selection
    const range = editor.isActive('link')
      ? getMarkRange($from, state.schema.marks.link)
      : !empty
        ? { from, to }
        : null
    const label = text.trim() || trimmedUrl

    if (range) {
      const currentText = state.doc.textBetween(range.from, range.to)
      if (label !== currentText) {
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: 'text',
            text: label,
            marks: [{ type: 'link', attrs: { href: trimmedUrl } }],
          })
          .run()
      } else {
        editor
          .chain()
          .focus()
          .setTextSelection(range)
          .extendMarkRange('link')
          .setLink({ href: trimmedUrl })
          .run()
      }
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: label,
          marks: [{ type: 'link', attrs: { href: trimmedUrl } }],
        })
        .run()
    }

    setOpen(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={editor.isActive('link')} aria-label="Link">
          <LinkIcon className="h-5 w-5" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="link-text" className="text-xs font-medium text-muted-foreground">
              Text
            </label>
            <Input
              id="link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
              placeholder="Link text"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="link-url" className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
              placeholder="https://example.com"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            {editor.isActive('link') && (
              <Button type="button" variant="outline" size="sm" onClick={removeLink}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
            <Button type="button" size="sm" onClick={applyLink} disabled={!url.trim()}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
