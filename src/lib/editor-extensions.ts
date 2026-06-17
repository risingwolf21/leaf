import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Markdown } from 'tiptap-markdown'
import type { Extensions } from '@tiptap/react'
import { ImageExtension } from '@/editor/extensions/ImageExtension'
import { CodeBlockView } from '@/components/editor/CodeBlockView'
import { WikiLink } from '@/editor/extensions/WikiLink'
import { TableOfContents } from '@/editor/extensions/TableOfContents'
import { SlashCommands } from '@/editor/extensions/SlashCommands'
import { ReadOnlyTaskItem } from '@/editor/extensions/ReadOnlyTaskItem'
import { lowlight } from '@/lib/highlight-languages'

const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  },
  // Ensure tiptap-markdown serialises the language attribute (e.g. ```typescript)
  addStorage() {
    return {
      markdown: {
        // tiptap-markdown calls these with its own internal types (no public exports).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          const language = (node.attrs.language as string | null) ?? ''
          state.write(`\`\`\`${language}\n`)
          state.text(node.textContent, false)
          state.ensureNewLine()
          state.write('```')
          state.closeBlock(node)
        },
      },
    }
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
  exitOnTripleEnter: true,
  exitOnArrowDown: true,
  HTMLAttributes: { class: 'leaf-code-block' },
})

export function createEditorExtensions(placeholder = ''): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // CodeBlockLowlight replaces StarterKit's built-in CodeBlock
      codeBlock: false,
    }),
    Placeholder.configure({ placeholder }),
    Link.configure({ openOnClick: false, autolink: true }),
    ImageExtension,
    TaskList,
    TaskItem.configure({
      nested: false,
      // Without this, TipTap reverts the checkbox on every click while
      // read-only. ReadOnlyTaskItem (below) does the actual persisting,
      // since this callback only gets (node, checked) — no position.
      onReadOnlyChecked: () => true,
    }),
    ReadOnlyTaskItem,
    // renderWrapper wraps the table in a `.tableWrapper` div so it can scroll
    // horizontally on its own — without it the table renders bare and gets
    // clipped by the page's overflow-x: hidden instead of scrolling.
    Table.configure({ resizable: false, renderWrapper: true }),
    TableRow,
    TableHeader,
    TableCell,
    WikiLink,
    TableOfContents,
    SlashCommands,
    CodeBlock,
    Markdown.configure({ html: false, transformPastedText: true }),
  ]
}
