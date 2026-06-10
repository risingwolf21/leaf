import type { ReactNode } from 'react'
import { ArrowLeft, Leaf, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface LayoutProps {
  children: ReactNode
  showBackButton: boolean
  onBack: () => void
}

export function Layout({ children, showBackButton, onBack }: LayoutProps) {
  const { signOut } = useAuth()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Back to notes"
              className="-ml-2 md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Leaf className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">Leaf</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
