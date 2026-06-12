import { useState } from 'react'
import { BookOpen, ChevronDown, ClipboardList, FileText, ListChecks, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { onActivateKey } from '@/lib/utils'
import type { AnyTemplate, Template } from '@/types'

const BUILTIN_ICONS: Record<string, typeof FileText> = {
  'builtin-meeting': ClipboardList,
  'builtin-todo': ListChecks,
  'builtin-journal': BookOpen,
  'builtin-project': FileText,
}

interface TemplatePickerProps {
  templates: Template[]
  onCreateBlank: () => void
  onSelectTemplate: (template: AnyTemplate) => void
}

/** Split "New note" button: the main action creates a blank note, the chevron opens a template picker. */
export function TemplatePicker({ templates, onCreateBlank, onSelectTemplate }: TemplatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (template: AnyTemplate) => {
    setOpen(false)
    onSelectTemplate(template)
  }

  return (
    <div className="flex flex-1">
      <Button onClick={onCreateBlank} className="flex-1 justify-center gap-2 rounded-r-none">
        <Plus className="h-4 w-4" />
        New note
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            aria-label="New note from template"
            className="shrink-0 rounded-l-none border-l border-primary-foreground/20"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2">
          <p className="px-2 pb-2 pt-1 text-sm font-medium text-foreground">New from template</p>
          <ItemGroup className="gap-1">
            <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Built-in
            </div>
            {BUILTIN_TEMPLATES.map((template) => {
              const Icon = BUILTIN_ICONS[template.id] ?? FileText
              const select = () => handleSelect({ type: 'builtin', template })

              return (
                <Item
                  key={template.id}
                  size="sm"
                  role="button"
                  tabIndex={0}
                  onClick={select}
                  onKeyDown={onActivateKey(select)}
                  className="cursor-pointer gap-2"
                >
                  <ItemMedia>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{template.name}</ItemTitle>
                  </ItemContent>
                </Item>
              )
            })}

            <Separator className="my-1" />
            <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your templates
            </div>
            {templates.length === 0 ? (
              <p className="px-2 pb-1 text-sm text-muted-foreground">
                No templates yet. Save a note as a template to see it here.
              </p>
            ) : (
              templates.map((template) => {
                const select = () => handleSelect({ type: 'custom', template })

                return (
                  <Item
                    key={template.id}
                    size="sm"
                    role="button"
                    tabIndex={0}
                    onClick={select}
                    onKeyDown={onActivateKey(select)}
                    className="cursor-pointer gap-2"
                  >
                    <ItemMedia>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="truncate">{template.name}</ItemTitle>
                    </ItemContent>
                  </Item>
                )
              })
            )}
          </ItemGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}
