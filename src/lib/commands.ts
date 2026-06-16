import type { ComponentType } from 'react'
import { FilePlus, FolderPlus, Moon, Settings, Trash2, HelpCircle, Download, Maximize2 } from 'lucide-react'

export type Command = {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  shortcut?: string
}

export const COMMANDS: Command[] = [
  { id: 'new-note', label: 'New note', icon: FilePlus, shortcut: '⌘N' },
  { id: 'new-folder', label: 'New folder', icon: FolderPlus },
  { id: 'toggle-theme', label: 'Toggle dark mode', icon: Moon },
  { id: 'settings', label: 'Open settings', icon: Settings },
  { id: 'trash', label: 'Open trash', icon: Trash2 },
  { id: 'help', label: 'Markdown guide', icon: HelpCircle },
  { id: 'export', label: 'Export all notes', icon: Download },
  { id: 'focus-mode', label: 'Toggle focus mode', icon: Maximize2 },
]
