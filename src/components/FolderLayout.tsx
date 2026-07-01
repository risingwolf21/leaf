import { cn } from '@/lib/utils'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar'
import { Leaf, Pin } from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useIsMobile } from '@/hooks/use-mobile'

function relDate(d: Date): string {
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function excerpt(body: string, len = 85): string {
    return body
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*`[\]_]/g, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, len)
        .concat(body.length > len ? "…" : "");
}

export function FolderLayout() {

    const isMobile = useIsMobile();

    const folder = location.pathname.split("/")[4];

    const navigate = useNavigate();

    const { data: notes = [] } = useNotes()

    return (
        <div className='h-full flex'>
            <Sidebar collapsible='none' className={cn({
                "w-[24rem]": !isMobile,
                "w-[100%]": isMobile
            })}>
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
                            {
                                notes.filter(x => x.folder_id === folder).map((note) => {
                                    const active = location.pathname.includes(`notes/${note.id}`)
                                    return <SidebarMenuItem>
                                        <div
                                            onClick={() => navigate(`notes/${note.id}`)}
                                            className={`group relative px-4 py-3.5 cursor-pointer border-b border-border transition-colors
                  ${active ? "bg-secondary" : "hover:bg-secondary/60"}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        {note.pinned && <Pin size={10} className="text-accent shrink-0" fill="currentColor" />}
                                                        <span className="text-sm font-medium text-foreground truncate leading-snug">{note.title}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt(note.content)}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <time className="text-xs text-muted-foreground/70 tabular-nums shrink-0">{relDate(new Date(note.updated_at))}</time>
                                                        {note.tags.slice(0, 2).map((t) => (
                                                            <span key={t.id} className="text-xs font-mono text-muted-foreground/60">#{t.name}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </SidebarMenuItem>
                                })
                            }
                        </SidebarGroup>

                    </div>
                </SidebarContent>
            </Sidebar>
            <div className='flex flex-1 w-full'>
                <main className={cn('h-full min-w-0 flex-1 overflow-hidden')}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
