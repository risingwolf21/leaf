import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { FolderTree } from '@/components/FolderTree'
import { NoteList } from '@/components/NoteList'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotesContext } from '@/context/NotesContext'
import { cn } from '@/lib/utils'

interface AppShellProps {
  /** Mobile-only header content for the detail pane (e.g. note title + toolbar). */
  headerContent?: ReactNode
  children: ReactNode
}

/**
 * Shared two-pane (list + detail) layout for everything under `/app`. On
 * mobile, only one pane is visible at a time based on the current route:
 * the note list at `/app`, or the detail pane for any nested route.
 */
export function AppShell({ headerContent, children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    folders,
    selectedFolderId,
    setSelectedFolderId,
    currentFolder,
    renamingFolderId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleCommitRename,
    handleCancelRename,
    handleDeleteFolder,
  } = useNotesContext()

  const isDetail = location.pathname !== '/app'

  const handleBack = () => {
    if (isDetail) {
      navigate('/app')
      return
    }
    if (currentFolder) {
      setSelectedFolderId(currentFolder.parent_id ?? 'all')
    }
  }

  const showBackButton = isDetail || currentFolder !== null

  return (
    <Layout showBackButton={showBackButton} onBack={handleBack} headerContent={headerContent}>
      <aside className="hidden h-full w-60 shrink-0 overflow-hidden border-r border-border md:block">
        <ScrollArea className="h-full">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onDeleteFolder={handleDeleteFolder}
            renamingFolderId={renamingFolderId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onStartRename={handleStartRename}
            onCommitRename={handleCommitRename}
            onCancelRename={handleCancelRename}
          />
        </ScrollArea>
      </aside>

      <aside
        className={cn(
          'h-full w-full shrink-0 overflow-hidden border-r border-border md:block md:w-80',
          isDetail ? 'hidden' : 'block'
        )}
      >
        <NoteList />
      </aside>

      <main className={cn('h-full min-w-0 flex-1 overflow-hidden', isDetail ? 'block' : 'hidden md:block')}>
        {children}
      </main>
    </Layout>
  )
}
