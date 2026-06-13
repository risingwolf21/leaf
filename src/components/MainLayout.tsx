import Sidebar from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import { SidebarProvider } from './ui/sidebar'
import { Toaster } from './ui/sonner'

export function MainLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className='flex min-h-dvh w-full'>
      <SidebarProvider>
        <Sidebar />
        <Toaster />
        <main className={cn('h-full min-w-0 flex-1 overflow-hidden')}>
          {children}
        </main>
      </SidebarProvider>
    </div>
  )
}
