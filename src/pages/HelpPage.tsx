import { EditorContent, useEditor } from '@tiptap/react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { createEditorExtensions } from '@/lib/editor-extensions'

interface Section {
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
    markdown: '```ts\nfunction greet(name: string) {\n  return `Hello, ${name}!`\n}\n```',
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
  const navigate = useNavigate()

  return (
    <div className="h-dvh overflow-y-auto bg-background">
      <div className="mx-auto max-w-[680px] px-4 py-6 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="mb-2 text-2xl font-bold text-foreground">Markdown guide</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Leaf notes are stored as Markdown. Here's how the most common syntax renders.
        </p>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((section, index) => (
            <div key={section.heading}>
              <MarkdownExample {...section} />
              {index < SECTIONS.length - 1 && <hr className="mt-8 border-border" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
