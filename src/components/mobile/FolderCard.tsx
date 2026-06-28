import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn, onActivateKey } from '@/lib/utils'

type FolderCardProps = {
  name: string
  count: number
  icon: ReactNode
  variant: 'grid' | 'list'
  onOpen: () => void
}

/** A folder tile (grid) or compact row (list) showing its name and direct-children count. */
export function FolderCard({ name, count, icon, variant, onOpen }: FolderCardProps) {
  const handleKeyDown = onActivateKey(onOpen)

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="cursor-pointer transition-colors hover:bg-accent"
    >
      <CardContent
        className={cn('flex items-center gap-2', variant === 'grid' ? 'flex-col items-start' : 'flex-row')}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 truncate text-sm font-medium text-foreground">{name}</span>
        <Badge variant="secondary">{count}</Badge>
      </CardContent>
    </Card>
  )
}
