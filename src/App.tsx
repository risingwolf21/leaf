import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { NotesProvider } from '@/context/NotesContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AuthPage from '@/pages/AuthPage'
import NoteEditorPage from '@/pages/NoteEditorPage'
import TrashPage from '@/pages/TrashPage'
import TemplatesPage from '@/pages/TemplatesPage'
import SettingsPage from '@/pages/SettingsPage'
import HelpPage from '@/pages/HelpPage'
import SharedNotePage from '@/pages/SharedNotePage'
import { Toaster } from '@/components/ui/sonner'
import { MainLayout } from './components/MainLayout'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename="/leaf">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/shared/:token" element={<SharedNotePage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <NotesProvider>
                    <MainLayout>
                      <Outlet />
                    </MainLayout>
                  </NotesProvider>
                </ProtectedRoute>
              }
            >
              <Route path="notes/:noteId" element={<NoteEditorPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="settings" element={<SettingsPage />} />
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
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
