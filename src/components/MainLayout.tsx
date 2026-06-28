import { Sidebar } from '@/components/Sidebar'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { OfflineBanner } from '@/components/OfflineBanner'
import { ConflictResolver } from '@/components/ConflictResolver'
import { useIsMobile } from '@/hooks/use-mobile'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { versionHistoryNote, closeVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()
  const isMobile = useIsMobile()

  return (
    <div className='flex min-h-dvh w-full flex-col'>
      <OfflineBanner />
      <ConflictResolver />
      <div className='flex flex-1 w-full'>
        <SidebarProvider>
          {!isMobile && <Sidebar />}
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
