import { Sidebar } from '@/components/Sidebar'
import { NoteListPanel } from '@/components/notelist/NoteListPanel'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { OfflineBanner } from '@/components/OfflineBanner'
import { ConflictResolver } from '@/components/ConflictResolver'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSortPreference } from '@/hooks/useSortPreference'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { versionHistoryNote, closeVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()
  const isMobile = useIsMobile()
  // Shared with Sidebar's file tree and the note-list panel, so both stay in sync.
  const [sortBy, setSortBy] = useSortPreference()

  return (
    <div className='flex min-h-dvh w-full flex-col'>
      <OfflineBanner />
      <ConflictResolver />
      <div className='flex flex-1 w-full'>
        <SidebarProvider>
          {!isMobile && <Sidebar sortBy={sortBy} setSortBy={setSortBy} />}
          {!isMobile && <NoteListPanel sortBy={sortBy} setSortBy={setSortBy} />}
          <Toaster />
          <main className={cn('h-full min-w-0 flex-1 overflow-hidden')}>
            {children}
          </main>
          <VersionHistorySheet
            note={versionHistoryNote}
            onOpenChange={(open) => !open && closeVersionHistory()}
            updateNote={updateNote}
          />
        </SidebarProvider>
      </div>
    </div>
  )
}
