import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type Heading = { level: 1 | 2 | 3; text: string }

export function ToCView({ editor, getPos }: NodeViewProps) {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    const update = () => {
      const found: Heading[] = []
      editor.state.doc.forEach((node) => {
        if (node.type.name === 'heading' && node.attrs.level <= 3) {
          found.push({ level: node.attrs.level as 1 | 2 | 3, text: node.textContent })
        }
      })
      setHeadings(found)
    }
    update()
    editor.on('update', update)
    return () => {
      editor.off('update', update)
    }
  }, [editor])

  const handleDelete = () => {
    const pos = getPos()
    if (pos === undefined) return
    editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
  }

  const scrollToHeading = (text: string) => {
    const editorEl = editor.view.dom
    const headingEls = editorEl.querySelectorAll('h1,h2,h3')
    for (const h of Array.from(headingEls)) {
      if (h.textContent === text) {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }

  return (
    <NodeViewWrapper contentEditable={false}>
      <div className="group relative my-4 rounded-lg border border-border bg-muted/30 p-4">
        <button
          onClick={handleDelete}
          className="leaf-toc-delete-btn absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 rounded p-1 hover:bg-muted"
          aria-label="Remove table of contents"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contents</p>
        {headings.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No headings yet.</p>
        ) : (
          <ol className="space-y-1">
            {headings.map((h, i) => (
              <li
                key={i}
                style={{ paddingLeft: `${(h.level - 1) * 1}rem` }}
                className="cursor-pointer text-sm text-foreground hover:text-primary hover:underline"
                onClick={() => scrollToHeading(h.text)}
              >
                {h.text}
              </li>
            ))}
          </ol>
        )}
      </div>
    </NodeViewWrapper>
  )
}
