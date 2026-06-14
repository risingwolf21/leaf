import { useEffect, useState } from 'react'
import { usePendingRename, type PendingRename } from '@/lib/sidebarStore'

type RenameTarget = Exclude<PendingRename, null>

/** Manages a sidebar row's inline-rename UI state, including auto-entering rename mode via `usePendingRename`. */
export function useInlineRename(target: RenameTarget, currentValue: string) {
  const { pendingRename, setPendingRename } = usePendingRename()
  const [isRenaming, setIsRenaming] = useState(false)
  const [value, setValue] = useState(currentValue)

  useEffect(() => {
    if (pendingRename?.kind === target.kind && pendingRename.id === target.id) {
      setValue(currentValue)
      setIsRenaming(true)
      setPendingRename(null)
    }
  }, [pendingRename, target.kind, target.id, currentValue, setPendingRename])

  const startRename = () => {
    setValue(currentValue)
    setIsRenaming(true)
  }

  const stopRename = () => setIsRenaming(false)

  return { isRenaming, value, setValue, startRename, stopRename }
}
