import { useParams } from 'react-router-dom'
import { AppBar } from '@/components/AppBar'
import { Sidebar } from '@/components/Sidebar'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { OfflineBanner } from '@/components/OfflineBanner'
import { ConflictResolver } from '@/components/ConflictResolver'
import { useAppBarConfig } from '@/lib/appBarStore'
import { useSortPreference } from '@/hooks/useSortPreference'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { versionHistoryNote, closeVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()
  const { noteId } = useParams<{ noteId?: string }>()
  const appBarConfig = useAppBarConfig()
  // Tracks window.visualViewport so the sticky AppBar isn't stranded above an
  // on-screen keyboard on iOS (dvh alone never shrinks for the keyboard).
  const viewportHeight = useVisualViewportHeight()
  // Shared with Sidebar's file tree and the note-list panel, so both stay in sync.
  const [sortBy] = useSortPreference()
  // On mobile, exactly one of the note-list panel or the routed page (detail)
  // is visible at a time; on desktop both are always visible side by side.
  const isNoteOpen = !!noteId

  return (
    <SidebarProvider>
      <div className='flex h-dvh w-full flex-col' style={viewportHeight ? { height: viewportHeight } : undefined}>
        <OfflineBanner />
        <ConflictResolver />
        <AppBar {...appBarConfig} />
        {/* will-change-transform makes this row a containing block for the sidebar's
          `fixed inset-y-0` panel, so it anchors below the AppBar instead of the
          true viewport top (which it would otherwise ignore entirely). */}
        <div className='flex flex-1 w-full overflow-hidden will-change-transform'>
          <Sidebar sortBy={sortBy} />
          <Toaster />
          <main className={cn('h-full min-w-0 flex-1 overflow-hidden', !isNoteOpen && 'hidden md:block')}>
            {children}
          </main>
          <VersionHistorySheet
            note={versionHistoryNote}
            onOpenChange={(open) => !open && closeVersionHistory()}
            updateNote={updateNote}
          />
        </div>
      </div>
    </SidebarProvider >
  )
}
