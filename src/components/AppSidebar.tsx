import { Folder, FolderOpen, Hash, Leaf, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'
import { useFolders } from '@/hooks/useFolders'
import { useTags } from '@/hooks/useTags'


export function AppSidebar() {
  const navigate = useNavigate()

  const tab = location.pathname.substring(1);

  const { data: folders = [] } = useFolders()
  const { data: tags = [] } = useTags()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenuItem>
          <SidebarMenuButton className="hover:bg-sidebar" onClick={undefined}>
            <Leaf className="h-4 w-4 shrink-0 text-primary" />
            <div className="truncate ml-2">Leaf</div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex h-full flex-col">

          <SidebarGroup>
            <SidebarGroupLabel>Folders</SidebarGroupLabel>

            <SidebarMenu>
              {
                folders.map((folder) => {
                  const isActive = tab.includes(`folders/${folder.id}`)
                  return <SidebarMenuItem key={folder.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(`folders/${folder.id}`)}>
                      {
                        isActive ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />
                      }
                      <div className="truncate ml-2">{folder.name}</div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                })
              }
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Tags</SidebarGroupLabel>

            <SidebarMenu>
              {
                tags.map((tag) => {
                  const isActive = tab.includes(`tags/${tag.id}`)
                  return <SidebarMenuItem key={tag.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(`tags/${tag.id}`)}>
                      <Hash className="h-4 w-4 shrink-0" />
                      <div className="truncate ml-2">{tag.name}</div>
                    </SidebarMenuButton>
                    <SidebarMenuAction>
                      <div>{tag.note_count}</div>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                })
              }
            </SidebarMenu>
          </SidebarGroup>

          <div className="shrink-0 border-t border-border p-2">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/app/settings')}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
