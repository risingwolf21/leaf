import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { Markdown } from 'tiptap-markdown'
import type { Extensions } from '@tiptap/react'
import { ImageUpload } from '@/editor/extensions/ImageUpload'
import { WikiLink } from '@/editor/extensions/WikiLink'

export function createEditorExtensions(placeholder = ''): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({ placeholder }),
    Link.configure({ openOnClick: false, autolink: true }),
    ImageUpload,
    TaskList,
    TaskItem.configure({ nested: false }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    WikiLink,
    Markdown.configure({ html: false, transformPastedText: true }),
  ]
}
