import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { queryClient } from '@/lib/queryClient'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AuthPage from '@/pages/AuthPage'
import HomePage from '@/pages/HomePage'
import NoteEditorPage from '@/pages/NoteEditorPage'
import TrashPage from '@/pages/TrashPage'
import TemplatesPage from '@/pages/TemplatesPage'
import SettingsPage from '@/pages/SettingsPage'
import ImportPage from '@/pages/ImportPage'
import HelpPage from '@/pages/HelpPage'
import SharedNotePage from '@/pages/SharedNotePage'
import { Toaster } from '@/components/ui/sonner'
import { MainLayout } from './components/MainLayout'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CommandPalette } from '@/components/CommandPalette'
import { CommandPaletteSheet } from '@/components/CommandPaletteSheet'

function AppShell() {
  const { open, setOpen } = useCommandPalette()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/shared/:token" element={<SharedNotePage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="notes/:noteId" element={<NoteEditorPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      {isDesktop ? (
        <CommandPalette open={open} onOpenChange={setOpen} />
      ) : (
        <CommandPaletteSheet open={open} onOpenChange={setOpen} />
      )}
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter basename="/leaf">
            <AppShell />
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
