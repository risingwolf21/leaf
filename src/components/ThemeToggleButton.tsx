import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

/** Compact light/dark toggle for the nav bar; the "system" preference remains available in Settings. */
export function ThemeToggleButton() {
  const { theme, setThemePreference } = useTheme()

  const toggle = () => setThemePreference(theme === 'dark' ? 'light' : 'dark')

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
