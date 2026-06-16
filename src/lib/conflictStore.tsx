import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type Conflict = {
  noteId: string
  noteTitle: string
  localVersion: { title?: string; content?: string }
  serverVersion: { title: string; content: string; updated_at: string }
  queuedAt: string
}

type ConflictContextValue = {
  conflicts: Conflict[]
  addConflict: (c: Conflict) => void
  removeConflict: (noteId: string) => void
}

const ConflictContext = createContext<ConflictContextValue | null>(null)

export function ConflictProvider({ children }: { children: ReactNode }) {
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  const addConflict = (c: Conflict) =>
    setConflicts((prev) => [...prev.filter((x) => x.noteId !== c.noteId), c])

  const removeConflict = (noteId: string) =>
    setConflicts((prev) => prev.filter((x) => x.noteId !== noteId))

  return (
    <ConflictContext.Provider value={{ conflicts, addConflict, removeConflict }}>
      {children}
    </ConflictContext.Provider>
  )
}

export function useConflicts() {
  const ctx = useContext(ConflictContext)
  if (!ctx) throw new Error('useConflicts must be used within ConflictProvider')
  return ctx
}
