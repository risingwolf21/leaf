import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { NotesProvider } from '@/context/NotesContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import AuthPage from '@/pages/AuthPage'
import NoteListPage from '@/pages/NoteListPage'
import NoteEditorPage from '@/pages/NoteEditorPage'
import TrashPage from '@/pages/TrashPage'
import TemplatesPage from '@/pages/TemplatesPage'
import HelpPage from '@/pages/HelpPage'
import SharedNotePage from '@/pages/SharedNotePage'

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
                  <NotesProvider />
                </ProtectedRoute>
              }
            >
              <Route index element={<NoteListPage />} />
              <Route path="notes/:noteId" element={<NoteEditorPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="templates" element={<TemplatesPage />} />
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
