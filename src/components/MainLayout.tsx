import { Sidebar } from '@/components/Sidebar'
import { VersionHistorySheet } from '@/components/VersionHistorySheet'
import { useUpdateNote } from '@/hooks/useNotes'
import { useVersionHistorySheet } from '@/lib/sidebarStore'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { versionHistoryNote, closeVersionHistory } = useVersionHistorySheet()
  const { updateNote } = useUpdateNote()

  return (
    <div className='flex min-h-dvh w-full'>
      <SidebarProvider>
        <Sidebar />
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
  )
}
