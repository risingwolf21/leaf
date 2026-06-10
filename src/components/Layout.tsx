import type { ReactNode } from 'react'
import { ArrowLeft, Leaf, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
  showBackButton: boolean
  onBack: () => void
  /** Mobile-only header content (e.g. note title + mode toggles) that replaces the brand/sign-out. */
  headerContent?: ReactNode
}

export function Layout({ children, showBackButton, onBack, headerContent }: LayoutProps) {
  const { signOut } = useAuth()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Back to notes"
              className="-ml-2 shrink-0 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {headerContent && (
            <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">{headerContent}</div>
          )}
          <div className={cn('shrink-0 items-center gap-2', headerContent ? 'hidden md:flex' : 'flex')}>
            <Leaf className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Leaf</span>
          </div>
        </div>
        <div className={cn('shrink-0', headerContent && 'hidden md:block')}>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
