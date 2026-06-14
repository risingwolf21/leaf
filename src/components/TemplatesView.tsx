import { useState } from 'react'
import {
  BookOpen,
  ClipboardList,
  FileText,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import type { AnyTemplate, Template } from '@/types'

const BUILTIN_ICONS: Record<string, typeof FileText> = {
  'builtin-meeting': ClipboardList,
  'builtin-todo': ListChecks,
  'builtin-journal': BookOpen,
  'builtin-project': FileText,
}

interface TemplatesViewProps {
  templates: Template[]
  onUseTemplate: (template: AnyTemplate) => void
  onSaveTemplate: (name: string, content: string) => Promise<void>
  onRenameTemplate: (id: string, name: string) => void
  onDeleteTemplate: (id: string) => void
}

export function TemplatesView({
  templates,
  onUseTemplate,
  onSaveTemplate,
  onRenameTemplate,
  onDeleteTemplate,
}: TemplatesViewProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const startCreating = () => {
    setName('')
    setContent('')
    setCreating(true)
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await onSaveTemplate(trimmed, content)
    setCreating(false)
  }

  const startRename = (template: Template) => {
    setRenamingId(template.id)
    setRenameValue(template.name)
  }

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) onRenameTemplate(id, trimmed)
    setRenamingId(null)
  }

  const cancelRename = () => setRenamingId(null)

  return (
    <div className="mx-auto flex h-full w-full max-w-content flex-col px-4 py-6 sm:px-6">
      <h1 className="mb-4 shrink-0 text-2xl font-semibold text-foreground">Templates</h1>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 pb-4">
          {creating ? (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Template content (Markdown)…"
                rows={6}
                spellCheck
                className="w-full resize-none rounded-md border border-input bg-background p-2 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
                  Save template
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startCreating} variant="outline" className="gap-2 self-start">
              <Plus className="h-4 w-4" />
              New blank template
            </Button>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your templates
            </h2>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom templates yet. Save a note as a template to see it here.
              </p>
            ) : (
              <ItemGroup className="gap-1">
                {templates.map((template) => {
                  const isRenaming = renamingId === template.id

                  return (
                    <Item key={template.id} size="sm" className="gap-2">
                      <ItemMedia>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </ItemMedia>
                      <ItemContent>
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(template.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(template.id)
                              if (e.key === 'Escape') cancelRename()
                            }}
                            className="min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        ) : (
                          <ItemTitle className="truncate">{template.name}</ItemTitle>
                        )}
                      </ItemContent>
                      {!isRenaming && (
                        <ItemActions>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button
                                type="button"
                                aria-label="Template actions"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>}/>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onUseTemplate({ type: 'custom', template })}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Use template
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => startRename(template)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                onClick={() => {
                                  if (window.confirm('Delete this template? This cannot be undone.')) {
                                    onDeleteTemplate(template.id)
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ItemActions>
                      )}
                    </Item>
                  )
                })}
              </ItemGroup>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Built-in templates
            </h2>
            <ItemGroup className="gap-1">
              {BUILTIN_TEMPLATES.map((template) => {
                const Icon = BUILTIN_ICONS[template.id] ?? FileText

                return (
                  <Item key={template.id} size="sm" className="gap-2">
                    <ItemMedia>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{template.name}</ItemTitle>
                    </ItemContent>
                  </Item>
                )
              })}
            </ItemGroup>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
