import { EditorContent, useEditor } from '@tiptap/react'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { AppBar } from '@/components/AppBar'

type Section = {
  heading: string
  markdown: string
}

const SECTIONS: Section[] = [
  {
    heading: 'Headings',
    markdown: '# Heading 1\n## Heading 2\n### Heading 3',
  },
  {
    heading: 'Text formatting',
    markdown: '**Bold**, *italic*, ***bold and italic***, and ~~strikethrough~~ text.',
  },
  {
    heading: 'Lists',
    markdown:
      '- First item\n- Second item\n  - Nested item\n\n1. First step\n2. Second step\n3. Third step',
  },
  {
    heading: 'Task lists',
    markdown: '- [ ] Unchecked task\n- [x] Checked task',
  },
  {
    heading: 'Links',
    markdown: '[Visit Example](https://example.com)',
  },
  {
    heading: 'Images',
    markdown: '![Placeholder image](https://placehold.co/600x400)\n\nLeaf does not support image uploads — paste a URL to an image hosted elsewhere.',
  },
  {
    heading: 'Inline code',
    markdown: 'Use the `useState` hook to manage component state.',
  },
  {
    heading: 'Code blocks',
    markdown: '```typescript\nfunction greet(name: string) {\n  return `Hello, ${name}!`\n}\n```',
  },
  {
    heading: 'Blockquotes',
    markdown: '> This is a blockquote.\n> It can span multiple lines.',
  },
  {
    heading: 'Horizontal rule',
    markdown: 'Above the line.\n\n---\n\nBelow the line.',
  },
  {
    heading: 'Tables',
    markdown: '| Feature | Status |\n| --- | --- |\n| Search | Done |\n| Dark mode | Planned |',
  },
]

function MarkdownExample({ heading, markdown }: Section) {
  const editor = useEditor(
    {
      extensions: createEditorExtensions(),
      content: markdown,
      editable: false,
      editorProps: {
        attributes: { class: 'markdown-preview' },
      },
    },
    []
  )

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{heading}</h2>
      <pre className="mb-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground">
        <code>{markdown}</code>
      </pre>
      {editor && (
        <div className="rounded-lg border border-border p-4">
          <EditorContent editor={editor} />
        </div>
      )}
    </section>
  )
}

export default function HelpPage() {

  return (
    <div>
      <AppBar
        className='!border-b !shadow-sm'
        title={""}
      />
      <main className='flex-1 size-full pb-safe-bottom'>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((section, index) => (
            <div key={section.heading}>
              <MarkdownExample {...section} />
              {index < SECTIONS.length - 1 && <hr className="mt-8 border-border" />}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
