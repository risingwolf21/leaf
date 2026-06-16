import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Code,
  Code2,
  Columns,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Rows,
  Table as TableIcon,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LinkEditPopover } from '@/components/LinkEditPopover'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/image-upload'
import { uploadImageAt } from '@/editor/extensions/ImageUpload'
import { VoiceMicButton } from '@/components/editor/VoiceMicButton'
import { ImageUrlDialog } from '@/components/editor/ImageUrlDialog'

type EditorToolbarProps = {
  editor: Editor
  isRecording: boolean
  isSupported: boolean
  onVoiceToggle: () => void
}

export function EditorToolbar({ editor, isRecording, isSupported, onVoiceToggle }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const { view, state } = editor
    uploadImageAt(view, file, state.selection.from)
  }

  const handleImageButtonClick = () => {
    // Open the URL dialog when no modifier is held; the hidden file input
    // remains accessible via the dropdown for uploading local files.
    setIsUrlDialogOpen(true)
  }

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto [&>*]:shrink-0">
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
      >
        <Heading1 className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
      >
        <Heading2 className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Heading 3"
      >
        <Heading3 className="h-5 w-5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Inline code"
      >
        <Code className="h-5 w-5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Code block"
      >
        <Code2 className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
      >
        <Quote className="h-5 w-5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-5 w-5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('taskList')}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
        aria-label="Task list"
      >
        <ListTodo className="h-5 w-5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <LinkEditPopover editor={editor} />

      <DropdownMenu>
        <DropdownMenuTrigger render={<Toggle size="sm" pressed={editor.isActive('table')} aria-label="Table">
            <TableIcon className="h-5 w-5" />
          </Toggle>}>
          
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {editor.isActive('table') ? (
            <>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                <Columns className="mr-2 h-4 w-4" />
                Insert column before
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Columns className="mr-2 h-4 w-4" />
                Insert column after
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                <Columns className="mr-2 h-4 w-4" />
                Delete column
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                <Rows className="mr-2 h-4 w-4" />
                Insert row above
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Rows className="mr-2 h-4 w-4" />
                Insert row below
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                <Rows className="mr-2 h-4 w-4" />
                Delete row
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                <TableIcon className="mr-2 h-4 w-4" />
                Toggle header row
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete table
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Insert table
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 px-2.5"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Horizontal rule"
      >
        <Minus className="h-5 w-5" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Toggle size="sm" aria-label="Insert image">
              <ImagePlus className="h-5 w-5" />
            </Toggle>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleImageButtonClick}>
            <LinkIcon className="mr-2 h-4 w-4" />
            From URL…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload file…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <VoiceMicButton
        isRecording={isRecording}
        isSupported={isSupported}
        onToggle={onVoiceToggle}
        />
      <ImageUrlDialog
        open={isUrlDialogOpen}
        onOpenChange={setIsUrlDialogOpen}
        editor={editor}
      />
    </div>
  )
}
