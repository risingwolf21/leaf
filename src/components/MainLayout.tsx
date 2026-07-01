import { OfflineBanner } from '@/components/OfflineBanner'
import { ConflictResolver } from '@/components/ConflictResolver'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'
import { AppSidebar } from './AppSidebar'

export function MainLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className='flex min-h-dvh w-full flex-col'>
      <OfflineBanner />
      <ConflictResolver />
      
      <div className='flex flex-1 w-full'>
        <SidebarProvider>
          <AppSidebar />
          <Toaster />
          <main className={cn('h-full min-w-0 flex-1 overflow-hidden')}>
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  )
}
