import { useState } from 'react'
import { ChevronRight, Folder as FolderIcon, MoreHorizontal, Notebook, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { cn, onActivateKey } from '@/lib/utils'
import type { Folder as FolderType } from '@/types'

interface FolderTreeProps {
  folders: FolderType[]
  selectedFolderId: string | 'all'
  onSelectFolder: (id: string | 'all') => void
  onDeleteFolder: (id: string) => void
  renamingFolderId: string | null
  renameValue: string
  onRenameValueChange: (value: string) => void
  onStartRename: (folder: FolderType) => void
  onCommitRename: (id: string) => void
  onCancelRename: () => void
}

const INDENT_REM = 1

/** Desktop sidebar: an "All Notes" entry plus a collapsible, recursive folder tree. */
export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onDeleteFolder,
  renamingFolderId,
  renameValue,
  onRenameValueChange,
  onStartRename,
  onCommitRename,
  onCancelRename,
}: FolderTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (folder: FolderType, depth: number) => {
    const children = folders.filter((f) => f.parent_id === folder.id)
    const isCollapsed = collapsedIds.has(folder.id)
    const isRenaming = renamingFolderId === folder.id
    const isSelected = selectedFolderId === folder.id
    const select = () => onSelectFolder(folder.id)

    return (
      <div key={folder.id} className="flex flex-col gap-1">
        <Item
          variant={isSelected ? 'muted' : 'default'}
          size="sm"
          role="button"
          tabIndex={0}
          aria-current={isSelected || undefined}
          onClick={() => !isRenaming && select()}
          onKeyDown={onActivateKey(() => !isRenaming && select())}
          className="group cursor-pointer gap-2"
          style={{ paddingLeft: `${0.75 + depth * INDENT_REM}rem` }}
        >
          {children.length > 0 ? (
            <button
              type="button"
              aria-label={isCollapsed ? `Expand ${folder.name}` : `Collapse ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapsed(folder.id)
              }}
              onKeyDown={(e) => e.stopPropagation()}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className={cn('h-4 w-4 transition-transform', !isCollapsed && 'rotate-90')} />
            </button>
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <ItemMedia>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
          </ItemMedia>
          <ItemContent>
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => onRenameValueChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => onCommitRename(folder.id)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') onCommitRename(folder.id)
                  if (e.key === 'Escape') onCancelRename()
                }}
                className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ) : (
              <ItemTitle className="truncate">{folder.name}</ItemTitle>
            )}
          </ItemContent>
          {!isRenaming && (
            <ItemActions className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <DropdownMenu>
                <DropdownMenuTrigger render={ <button
                    type="button"
                    aria-label="Folder actions"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>}>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartRename(folder)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        window.confirm(
                          `Delete "${folder.name}"? Subfolders will also be deleted, and all notes inside will become Unfiled.`
                        )
                      ) {
                        onDeleteFolder(folder.id)
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          )}
        </Item>
        {!isCollapsed && children.length > 0 && (
          <div className="flex flex-col gap-1">{children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const rootFolders = folders.filter((f) => f.parent_id === null)

  return (
    <ItemGroup className="gap-1 p-2">
      <Item
        variant={selectedFolderId === 'all' ? 'muted' : 'default'}
        size="sm"
        role="button"
        tabIndex={0}
        aria-current={selectedFolderId === 'all' || undefined}
        onClick={() => onSelectFolder('all')}
        onKeyDown={onActivateKey(() => onSelectFolder('all'))}
        className="cursor-pointer gap-2"
      >
        <span className="size-5 shrink-0" />
        <ItemMedia>
          <Notebook className="h-4 w-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>All Notes</ItemTitle>
        </ItemContent>
      </Item>
      {rootFolders.map((folder) => renderNode(folder, 0))}
    </ItemGroup>
  )
}
