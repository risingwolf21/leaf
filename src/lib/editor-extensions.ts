import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from 'tiptap-markdown'
import type { Extensions } from '@tiptap/react'

export function createEditorExtensions(placeholder = ''): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({ placeholder }),
    Link.configure({ openOnClick: false, autolink: true }),
    Image,
    TaskList,
    TaskItem.configure({ nested: false }),
    Markdown.configure({ html: false, transformPastedText: true }),
  ]
}
