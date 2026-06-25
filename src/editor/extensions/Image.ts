import { nodePasteRule } from '@tiptap/core'
import Image from '@tiptap/extension-image'

// Matches bare image URLs pasted into the editor so they become inline image nodes
// rather than plain text. The regex covers common image extensions with optional
// query strings (e.g. CDN cache-busting params).
const IMAGE_URL_REGEX = /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?/gi

// Markdown has no native image-width syntax, so the chosen size round-trips
// through the image title (`![alt](src "size:small")`). markdown-it parses
// that title into a plain `title` HTML attribute (not `data-width`), so
// parseHTML must decode it from there too, not just from `data-width`.
const SIZE_TITLE_REGEX = /^size:(small|medium|large)$/

function encodeWidthTitle(width: string): string | null {
  return width !== 'medium' ? `size:${width}` : null
}

function decodeWidthFromTitle(title: string | null): string | null {
  return title?.match(SIZE_TITLE_REGEX)?.[1] ?? null
}

export const ImageWithResize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'medium',
        parseHTML: (el) => el.getAttribute('data-width') ?? decodeWidthFromTitle(el.getAttribute('title')) ?? 'medium',
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
          const sizeTitle = encodeWidthTitle(width)
          const title = sizeTitle ? ` "${sizeTitle}"` : ''
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
