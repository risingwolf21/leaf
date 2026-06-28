import { Code2, Columns2 } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ViewMode } from '@/types'

type EditorModeToggleProps = {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  /** False for collaborative notes, which can't use source/split modes since they bypass the Yjs document. */
  canUseRawModes?: boolean
}

/** Lets the user switch between the rich editor and raw markdown source/split views. */
export function EditorModeToggle({ mode, onModeChange, canUseRawModes = true }: EditorModeToggleProps) {
  const isMobile = useIsMobile()

  if (!canUseRawModes) return null

  return (
    <>
      {mode !== 'split' && (
        <Toggle
          size="sm"
          pressed={mode === 'source'}
          onPressedChange={(pressed) => onModeChange(pressed ? 'source' : 'edit')}
          aria-label="Toggle source view"
        >
          <Code2 className="h-4 w-4" />
        </Toggle>
      )}
      {!isMobile && (
        <Toggle
          size="sm"
          pressed={mode === 'split'}
          onPressedChange={(pressed) => onModeChange(pressed ? 'split' : 'edit')}
          aria-label="Toggle split view"
        >
          <Columns2 className="h-4 w-4" />
        </Toggle>
      )}
    </>
  )
}
