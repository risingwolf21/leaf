import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { queryClient } from '@/lib/queryClient'
import { ConflictProvider } from '@/lib/conflictStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AuthPage from '@/pages/AuthPage'
import FolderPage from '@/pages/FolderPage'
import TagPage from '@/pages/TagPage'
import NoteEditorPage from '@/pages/NoteEditorPage'
import TrashPage from '@/pages/TrashPage'
import TemplatesPage from '@/pages/TemplatesPage'
import SettingsPage from '@/pages/SettingsPage'
import ImportPage from '@/pages/ImportPage'
import HelpPage from '@/pages/HelpPage'
import SharedNotePage from '@/pages/SharedNotePage'
import { Toaster } from '@/components/ui/sonner'
import { MainLayout } from './components/MainLayout'
import { ALL_NOTES_FOLDER_ID } from '@/components/sidebar/VirtualFolderNode'

function AppShell() {

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
          <Route index element={<Navigate to={`/app/folders/${ALL_NOTES_FOLDER_ID}`} replace />} />

          <Route path="folders/:folderId" element={<FolderPage />}>
            <Route path="notes/:noteId" element={<NoteEditorPage />} />
          </Route>

          <Route path="tags/:tagId" element={<TagPage />}>
            <Route path="notes/:noteId" element={<NoteEditorPage />} />
          </Route>

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
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConflictProvider>
            <BrowserRouter basename="/leaf">
              <AppShell />
            </BrowserRouter>
            <Toaster />
          </ConflictProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
