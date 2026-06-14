import type { ReactNode } from 'react'
import { ArrowRight, Download, LayoutTemplate, LogOut, Moon, Sun, Monitor, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { useFolders } from '@/hooks/useFolders'
import { useNotes, useTrashedNotes } from '@/hooks/useNotes'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'
import { exportAllNotes } from '@/lib/export'
import { AppBar } from '@/components/AppBar'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="rounded-lg border border-border">{children}</div>
    </section>
  )
}

function SettingsLink({ to, icon: Icon, label, badge }: { to: string; icon: typeof Trash2; label: string; badge?: number }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && <Badge variant="secondary">{badge}</Badge>}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { themePreference, setThemePreference } = useTheme()
  const { data: notes = [] } = useNotes()
  const { data: folders = [] } = useFolders()
  const { data: trashedNotes = [] } = useTrashedNotes()

  const handleExport = () => {
    void exportAllNotes(notes, folders)
  }

  return (
    <div>
      <AppBar
        className='!border-b !shadow-sm'
        title={""}
      />
      <main className='flex-1 size-full pb-safe-bottom'>
        <ScrollArea className="h-full">
          <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>

            <SettingsSection title="Account">
              <div className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="min-w-0 truncate text-sm text-foreground">{user?.email}</span>
                <Button variant="outline" size="sm" onClick={signOut} className="shrink-0 gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SettingsSection>

            <SettingsSection title="Appearance">
              <div className="flex gap-2 p-3">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={themePreference === value ? 'secondary' : 'outline'}
                    className="flex-1 gap-2"
                    aria-pressed={themePreference === value}
                    onClick={() => setThemePreference(value)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="Data">
              <div className="flex flex-col divide-y divide-border">
                <SettingsLink to="/app/trash" icon={Trash2} label="Trash" badge={trashedNotes.length} />
                <SettingsLink to="/app/templates" icon={LayoutTemplate} label="Manage templates" />
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">Export all notes</span>
                </button>
              </div>
            </SettingsSection>

            <SettingsSection title="About">
              <div className="flex flex-col divide-y divide-border">
                <div className="flex items-center justify-between gap-2 px-3 py-3 text-sm">
                  <span className="text-foreground">Leaf</span>
                  <span className="text-muted-foreground">v1.0.0</span>
                </div>
                <Link
                  to="/help"
                  className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <span className="flex-1">Markdown guide</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </SettingsSection>
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
