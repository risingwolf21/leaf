import { Mark, mergeAttributes, markInputRule, markPasteRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Suggestion, type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion'
import type MarkdownIt from 'markdown-it'
import { cn } from '@/lib/utils'

/** Minimal shape of markdown-it's inline parser state used by {@link wikiLinkInlineRule}. */
type MarkdownItInlineState = {
  src: string
  pos: number
  posMax: number
  push: (type: string, tag: string, nesting: 1 | 0 | -1) => { content: string }
}

type WikiLinkMarkdownSpec = {
  serialize: {
    open: string
    close: string
    escape: false
  }
  parse: {
    setup: (markdownit: MarkdownIt) => void
  }
}

export type WikiLinkOptions = {
  HTMLAttributes: Record<string, unknown>
}

export type WikiLinkStorage = {
  /** Titles of the current user's notes, used to resolve links and drive autocomplete. */
  noteTitles: Set<string>
  /** Called with a note title when a wiki-link is clicked. */
  onNavigate: (title: string) => void
  markdown: WikiLinkMarkdownSpec
}

export const wikiLinkInputRegex = /(?:^|\s)(\[\[([^[\]\n]+)\]\])$/
export const wikiLinkPasteRegex = /(?:^|\s)(\[\[([^[\]\n]+)\]\])/g

const wikiLinkDecorationsKey = new PluginKey('wikiLinkDecorations')
const wikiLinkSuggestionKey = new PluginKey('wikiLinkSuggestion')

/**
 * markdown-it inline rule for `[[Title]]`. Registered before the `link` rule so
 * `[[...]]` is never mistaken for a reference-style link.
 */
function wikiLinkInlineRule(state: MarkdownItInlineState, silent: boolean): boolean {
  const start = state.pos
  const max = state.posMax

  if (state.src.charCodeAt(start) !== 0x5b /* [ */ || state.src.charCodeAt(start + 1) !== 0x5b) {
    return false
  }

  let pos = start + 2
  let found = false

  while (pos < max) {
    const code = state.src.charCodeAt(pos)
    if (code === 0x5d /* ] */) {
      found = state.src.charCodeAt(pos + 1) === 0x5d
      break
    }
    if (code === 0x0a /* \n */ || code === 0x5b /* [ */) break
    pos++
  }

  if (!found) return false

  const title = state.src.slice(start + 2, pos)
  if (!title) return false

  if (!silent) {
    const token = state.push('wikilink', '', 0)
    token.content = title
  }

  state.pos = pos + 2
  return true
}

function createSuggestionRenderer() {
  let element: HTMLDivElement | null = null
  let items: string[] = []
  let selectedIndex = 0
  let select: ((title: string) => void) | null = null

  const renderItems = () => {
    if (!element) return
    element.innerHTML = ''

    if (items.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'px-2 py-1.5 text-sm text-muted-foreground'
      empty.textContent = 'No matching notes'
      element.appendChild(empty)
      return
    }

    items.forEach((title, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = title
      button.className = cn(
        'block w-full truncate rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
        index === selectedIndex ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
      )
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
        select?.(title)
      })
      element?.appendChild(button)
    })
  }

  const updatePosition = (rect: DOMRect | null | undefined) => {
    if (!element || !rect) return
    element.style.left = `${rect.left}px`
    element.style.top = `${rect.bottom + 4}px`
  }

  return {
    onStart: (props: SuggestionProps<string, string>) => {
      items = props.items
      selectedIndex = 0
      select = (title) => props.command(title)

      element = document.createElement('div')
      element.className =
        'fixed z-50 max-h-60 w-56 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md'
      renderItems()
      document.body.appendChild(element)
      updatePosition(props.clientRect?.())
    },
    onUpdate: (props: SuggestionProps<string, string>) => {
      items = props.items
      selectedIndex = 0
      select = (title) => props.command(title)
      renderItems()
      updatePosition(props.clientRect?.())
    },
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'Escape') {
        element?.remove()
        element = null
        return true
      }
      if (event.key === 'ArrowDown') {
        if (items.length > 0) {
          selectedIndex = (selectedIndex + 1) % items.length
          renderItems()
        }
        return true
      }
      if (event.key === 'ArrowUp') {
        if (items.length > 0) {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length
          renderItems()
        }
        return true
      }
      if (event.key === 'Enter') {
        const title = items[selectedIndex]
        if (title) select?.(title)
        return true
      }
      return false
    },
    onExit: () => {
      element?.remove()
      element = null
    },
  }
}

export const WikiLink = Mark.create<WikiLinkOptions, WikiLinkStorage>({
  name: 'wikiLink',

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addStorage() {
    return {
      noteTitles: new Set<string>(),
      onNavigate: () => {},
      markdown: {
        serialize: {
          open: '[[',
          close: ']]',
          escape: false,
        },
        parse: {
          setup(markdownit: MarkdownIt) {
            // Augments markdown-it's type with a custom flag not in its type definitions.
            const md = markdownit as MarkdownIt & { wikiLinkRuleAdded?: boolean }
            // setup() runs on every parse(), so guard against registering the rule twice
            if (md.wikiLinkRuleAdded) return
            md.wikiLinkRuleAdded = true

            md.inline.ruler.before('link', 'wikiLink', wikiLinkInlineRule)
            md.renderer.rules.wikilink = (tokens, index) => {
              const title = md.utils.escapeHtml(tokens[index].content)
              return `<span data-wiki-link="${title}">${title}</span>`
            }
          },
        },
      },
    }
  },

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-wiki-link'),
        renderHTML: (attributes) => {
          if (!attributes.title) return {}
          return { 'data-wiki-link': attributes.title }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'wiki-link' }), 0]
  },

  addInputRules() {
    return [
      markInputRule({
        find: wikiLinkInputRegex,
        type: this.type,
        getAttributes: (match) => ({ title: match[2] }),
      }),
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: wikiLinkPasteRegex,
        type: this.type,
        getAttributes: (match) => ({ title: match[2] }),
      }),
    ]
  },

  addProseMirrorPlugins() {
    const { storage, editor } = this

    return [
      new Plugin({
        key: wikiLinkDecorationsKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = []

            state.doc.descendants((node, pos) => {
              if (!node.isText) return
              const mark = node.marks.find((item) => item.type.name === 'wikiLink')
              // ProseMirror mark attrs are typed as Record<string, any>.
              if (!mark || storage.noteTitles.has(mark.attrs.title as string)) return

              decorations.push(Decoration.inline(pos, pos + node.nodeSize, { class: 'wiki-link-broken' }))
            })

            return DecorationSet.create(state.doc, decorations)
          },
          handleClick: (_view, _pos, event) => {
            if (event.button !== 0) return false

            // DOM event targets are typed as EventTarget | null; this handler only runs on element clicks.
            const target = event.target as HTMLElement
            const link = target.closest<HTMLElement>('[data-wiki-link]')
            if (!link) return false

            const title = link.dataset.wikiLink
            if (!title) return false

            storage.onNavigate(title)
            return true
          },
        },
      }),
      Suggestion<string, string>({
        editor,
        pluginKey: wikiLinkSuggestionKey,
        char: '[[',
        allowSpaces: false,
        items: ({ query }) => {
          const lowerQuery = query.toLowerCase()
          return Array.from(storage.noteTitles)
            .filter((title) => title.toLowerCase().includes(lowerQuery))
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 10)
        },
        command: ({ editor: commandEditor, range, props }) => {
          commandEditor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: 'text',
                text: props,
                marks: [{ type: 'wikiLink', attrs: { title: props } }],
              },
            ])
            .run()
        },
        render: createSuggestionRenderer,
      }),
    ]
  },
})
