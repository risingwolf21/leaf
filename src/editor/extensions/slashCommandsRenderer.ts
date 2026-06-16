import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { SlashCommandItem } from '@/components/editor/SlashCommandMenu'
import { SlashCommandMenu } from '@/components/editor/SlashCommandMenu'
import { filterSlashCommands } from './slashCommandItems'

/**
 * Creates a Suggestion `render` factory that mounts a React SlashCommandMenu
 * into a fixed-positioned container appended to document.body.
 */
export function createMenuRenderer() {
  let container: HTMLDivElement | null = null
  // createRoot returns Root, but we close over it across async boundaries;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let root: any = null
  let selectedIndex = 0

  const renderMenu = (
    items: SlashCommandItem[],
    command: (item: SlashCommandItem) => void,
    rect: DOMRect | null | undefined
  ) => {
    if (!container) return
    if (rect) {
      container.style.left = `${rect.left}px`
      container.style.top = `${rect.bottom + 4}px`
    }
    root?.render(createElement(SlashCommandMenu, { items, selectedIndex, command }))
  }

  return {
    onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
      selectedIndex = 0
      container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.zIndex = '50'
      document.body.appendChild(container)
      root = createRoot(container)
      renderMenu(props.items, (item) => props.command(item), props.clientRect?.())
    },
    onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
      selectedIndex = 0
      renderMenu(props.items, (item) => props.command(item), props.clientRect?.())
    },
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'Escape') {
        container?.remove()
        container = null
        root = null
        return true
      }
      const items = filterSlashCommands('')
      if (event.key === 'ArrowDown') {
        selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1)
        return true
      }
      if (event.key === 'ArrowUp') {
        selectedIndex = (selectedIndex - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1)
        return true
      }
      return false
    },
    onExit: () => {
      // Defer unmount to avoid destroying the root during a React render cycle
      setTimeout(() => {
        root?.unmount()
        container?.remove()
        container = null
        root = null
      }, 0)
    },
  }
}
