import { cn } from '@/lib/utils'

export type SlashCommandItem = {
  id: string
  label: string
  description: string
}

type SlashCommandMenuProps = {
  items: SlashCommandItem[]
  selectedIndex: number
  command: (item: SlashCommandItem) => void
}

export function SlashCommandMenu({ items, selectedIndex, command }: SlashCommandMenuProps) {
  if (items.length === 0) return null

  return (
    <div className="z-50 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
      {items.map((item, index) => {
        const handleMouseDown = (event: React.MouseEvent) => {
          // Prevent editor from losing focus before command fires
          event.preventDefault()
          command(item)
        }

        return (
          <button
            key={item.id}
            type="button"
            onMouseDown={handleMouseDown}
            className={cn(
              'flex w-full flex-col px-3 py-2 text-left transition-colors',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.description}</span>
          </button>
        )
      })}
    </div>
  )
}
