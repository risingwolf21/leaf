import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ToCView } from '@/components/editor/ToCView'

// tiptap-markdown exposes no public types for the storage markdown spec;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarkdownSerialiserState = any

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toc"]' }]
  },

  renderHTML() {
    return ['div', { 'data-type': 'toc' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToCView)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerialiserState) {
          state.write('<!-- toc -->')
          state.closeBlock({ attrs: {} })
        },
        parse: {
          // tiptap-markdown parses HTML before handing it to ProseMirror, so
          // the <!-- toc --> comment becomes a raw HTML comment node. We let
          // parseHTML() above catch the rendered <div data-type="toc"> form
          // instead; the comment form is handled by a markdown-it plugin below.
          setup(markdownit: { core: { ruler: { push: (name: string, fn: (state: { tokens: { type: string; content: string; attrSet?: (k: string, v: string) => void }[] }) => void) => void } } }) {
            markdownit.core.ruler.push('toc_comment', (state) => {
              for (let i = 0; i < state.tokens.length; i++) {
                const tok = state.tokens[i]
                if (tok.type === 'html_block' && tok.content.trim() === '<!-- toc -->') {
                  tok.type = 'toc_node'
                  tok.content = ''
                }
              }
            })
            // Renderer is a no-op; ProseMirror's parseHTML handles the tag.
          },
        },
      },
    }
  },
})
