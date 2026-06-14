import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar'
import { useCollapsedFolders } from '@/hooks/useCollapsedFolders'
import { cn } from '@/lib/utils'

/** Synthetic id for the virtual "All notes" folder (unfiled notes), used for collapse-state persistence. */
export const ALL_NOTES_FOLDER_ID = '__all-notes__'

/** Synthetic id for the virtual "Shared with me" folder, used for collapse-state persistence. */
export const SHARED_WITH_ME_FOLDER_ID = '__shared-with-me__'

type VirtualFolderNodeProps = {
  id: string
  label: string
  icon: ReactNode
  forceOpen?: boolean
  children: ReactNode
}

/** Renders a collapsible "virtual" folder row that isn't backed by a database folder, e.g. unfiled or shared notes. */
export function VirtualFolderNode({ id, label, icon, forceOpen, children }: VirtualFolderNodeProps) {
  const { collapsedFolderIds, toggleFolderCollapsed } = useCollapsedFolders()
  const isOpen = forceOpen || !collapsedFolderIds.has(id)

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={() => toggleFolderCollapsed(id)} className="group/collapsible">
        <CollapsibleTrigger
          render={(triggerProps, state) => (
            <SidebarMenuButton {...triggerProps}>
              <ChevronRight className={cn('transition-transform', state.open && 'rotate-90')} />
              {icon}
              <span className="truncate">{label}</span>
            </SidebarMenuButton>
          )}
        />
        <CollapsibleContent>
          <SidebarMenuSub className="pr-0 mr-0">{children}</SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
