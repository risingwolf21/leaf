import { PanelBottomClose, PanelBottomOpen } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

type ToolbarVisibilityToggleProps = {
  isVisible: boolean
  onToggle: () => void
}

/** Lets the user hide the formatting toolbar to reclaim vertical space while editing. */
export function ToolbarVisibilityToggle({ isVisible, onToggle }: ToolbarVisibilityToggleProps) {
  return (
    <Toggle size="sm" pressed={isVisible} onPressedChange={onToggle} aria-label="Toggle toolbar visibility">
      {isVisible ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
    </Toggle>
  )
}
