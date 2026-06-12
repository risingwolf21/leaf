import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Sidebar, { SidebarContent } from '@/components/Sidebar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  /** Mobile-only header content for the detail pane (e.g. note title + toolbar). */
  headerContent?: ReactNode
  children: ReactNode
}

/**
 * Shared layout for everything under `/app`: the sidebar (desktop collapsible
 * aside, mobile inline panel at the index route, or mobile drawer for detail
 * routes) plus the main detail pane.
 */
export function AppShell({ headerContent, children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isDetail = location.pathname !== '/app'

  const handleBack = () => navigate('/app')

  return (
    <Layout showBackButton={isDetail} onBack={handleBack} headerContent={headerContent}>
      <Sidebar />

      {!isDetail && (
        <div className="h-full w-full overflow-hidden md:hidden">
          <SidebarContent />
        </div>
      )}

      <main className={cn('h-full min-w-0 flex-1 overflow-hidden', isDetail ? 'block' : 'hidden md:block')}>
        {children}
      </main>
    </Layout>
  )
}
