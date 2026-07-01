import { useSyncExternalStore, type ReactNode } from 'react'
import { createStore } from '@/lib/sidebarStore'

export type AppBarConfig = {
  primaryAction?: ReactNode | 'back' | 'default'
  navigateBackPath?: string
  actions?: ReactNode
  showNewNoteButton?: boolean
  bottomContent?: ReactNode
}

const appBarConfigStore = createStore<AppBarConfig>({})

/** The active page's AppBar configuration, rendered once by MainLayout. */
export function useAppBarConfig() {
  return useSyncExternalStore(appBarConfigStore.subscribe, appBarConfigStore.getSnapshot)
}

/**
 * Configures the shared AppBar (rendered once in MainLayout) for the
 * currently active page. Every page under MainLayout should call this —
 * even with no args, for a plain bar — so navigating away always replaces
 * the previous page's config instead of momentarily inheriting it. Setting
 * directly during render (not in a useEffect) keeps the header in sync
 * immediately and avoids ever needing JSX (actions/bottomContent) in a
 * dependency array.
 */
export function useSetAppBar(config: AppBarConfig = {}) {
  appBarConfigStore.setState(config)
}
