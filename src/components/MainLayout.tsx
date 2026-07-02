import { AppBar } from '@/components/AppBar'
import { Sidebar } from '@/components/Sidebar'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { OfflineBanner } from '@/components/OfflineBanner'
import { ConflictResolver } from '@/components/ConflictResolver'
import { useAppBarConfig } from '@/lib/appBarStore'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { versionHistoryNote, closeVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()
  const appBarConfig = useAppBarConfig()
  // Tracks window.visualViewport so the sticky AppBar isn't stranded above an
  // on-screen keyboard on iOS (dvh alone never shrinks for the keyboard).
  const viewportHeight = useVisualViewportHeight()

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
          <Sidebar />
          <Toaster />
          <main className="h-full min-w-0 flex-1 overflow-hidden">{children}</main>
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
