import { Code2, Columns2, Pencil } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useIsMobile } from '@/hooks/use-mobile'
import type { ViewMode } from '@/types'

type EditorModeToggleProps = {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  /** False for collaborative notes, which can't use source/split modes since they bypass the Yjs document. */
  canUseRawModes?: boolean
}

export function EditorModeToggle({ mode, onModeChange, canUseRawModes = true }: EditorModeToggleProps) {
  const isMobile = useIsMobile()

  return (
    <>
      {mode !== 'split' && (
        <>
          {mode !== 'preview' && canUseRawModes && (
            <Toggle
              size="sm"
              pressed={mode === 'source'}
              onPressedChange={(pressed) => onModeChange(pressed ? 'source' : 'edit')}
              aria-label="Toggle source view"
            >
              <Code2 className="h-4 w-4" />
            </Toggle>
          )}
          <Toggle
            size="sm"
            pressed={mode !== 'preview'}
            onPressedChange={(pressed) => onModeChange(pressed ? 'edit' : 'preview')}
            aria-label="Toggle edit mode"
          >
            <Pencil className="h-4 w-4" />
          </Toggle>
        </>
      )}
      {!isMobile && canUseRawModes && (
        <Toggle
          size="sm"
          pressed={mode === 'split'}
          onPressedChange={(pressed) => onModeChange(pressed ? 'split' : 'preview')}
          aria-label="Toggle split view"
        >
          <Columns2 className="h-4 w-4" />
        </Toggle>
      )}
    </>
  )
}
