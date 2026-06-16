import type { SlashCommandItem } from '@/components/editor/SlashCommandMenu'

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'toc',
    label: 'Table of Contents',
    description: 'Insert a live heading outline',
  },
]

export function filterSlashCommands(query: string): SlashCommandItem[] {
  const lower = query.toLowerCase()
  return SLASH_COMMANDS.filter(
    (cmd) => cmd.id.includes(lower) || cmd.label.toLowerCase().includes(lower)
  )
}
