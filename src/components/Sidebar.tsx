import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileTreeRoot } from '@/components/sidebar/FileTreeRoot'
import { Sidebar as SidebarPrimitive, useSidebar } from './ui/sidebar'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  // On mobile the sidebar takes the full screen, so hide it whenever navigation
  // reveals a page (e.g. opening a folder or note) to act like the previous "page".
  useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [location.pathname, isMobile, setOpenMobile])

  return (
    <SidebarPrimitive>
      <div className="flex h-full flex-col">

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2">
            <FileTreeRoot />
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/app/settings')}>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </SidebarPrimitive>
  )
}
