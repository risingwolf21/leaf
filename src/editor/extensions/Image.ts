import { nodePasteRule } from '@tiptap/core'
import Image from '@tiptap/extension-image'

// Matches bare image URLs pasted into the editor so they become inline image nodes
// rather than plain text. The regex covers common image extensions with optional
// query strings (e.g. CDN cache-busting params).
const IMAGE_URL_REGEX = /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?/gi

export const ImageWithResize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'medium',
        parseHTML: (el) => el.getAttribute('data-width') ?? 'medium',
        renderHTML: (attrs) => ({ 'data-width': attrs.width as string }),
      },
    }
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: IMAGE_URL_REGEX,
        type: this.type,
        getAttributes: (match) => ({ src: match[0] as string, width: 'medium' }),
      }),
    ]
  },

  // tiptap-markdown has no exported types for its serialize API — `any` is required
  // here to extend the storage with markdown serialization metadata.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addStorage(): any {
    return {
      markdown: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          const { src, alt, width } = node.attrs as { src: string; alt: string; width: string }
          // Encode the size in the title field so roundtrips preserve the chosen width.
          const title = width && width !== 'medium' ? ` "size:${width}"` : ''
          state.write(`![${alt ?? ''}](${src}${title})`)
          state.closeBlock(node)
        },
      },
    }
  },
}).configure({
  HTMLAttributes: { class: 'leaf-image' },
  allowBase64: false,
})
