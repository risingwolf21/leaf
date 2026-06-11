import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { AddLinkForm, type LinkFormValues } from '@/components/AddLinkForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNoteLinks } from '@/hooks/useNoteLinks'
import { cn } from '@/lib/utils'
import type { NoteLink } from '@/types'

interface LinksPanelProps {
  noteId: string
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const menuButtonClass =
  'rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100'

export function LinksPanel({ noteId }: LinksPanelProps) {
  const {
    links,
    loading,
    pendingPreviewIds,
    addLink,
    updateLink,
    deleteLink,
    togglePreview,
    refreshPreview,
  } = useNoteLinks(noteId)

  const [expanded, setExpanded] = useState(false)
  const initializedRef = useRef(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<NoteLink | null>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const suppressFocusRestoreRef = useRef(false)

  useEffect(() => {
    if (!loading && !initializedRef.current) {
      initializedRef.current = true
      setExpanded(links.length > 0)
    }
  }, [loading, links.length])

  const handleAddClick = () => {
    setEditingLink(null)
    setFormOpen(true)
  }

  const handleEditClick = (link: NoteLink) => {
    // The dropdown menu restores focus to its trigger button when it closes,
    // which would land focus outside the popover/sheet we're about to open
    // and immediately dismiss it. Suppress that one-time restoration.
    suppressFocusRestoreRef.current = true
    // Defer so the dropdown's dismissable layer fully unmounts before the
    // popover/sheet's own layer mounts, otherwise it dismisses itself instantly.
    setTimeout(() => {
      setEditingLink(link)
      setFormOpen(true)
    }, 0)
  }

  const handleSave = (values: LinkFormValues) => {
    if (editingLink) {
      updateLink(editingLink.id, values)
    } else {
      addLink(values)
      setExpanded(true)
    }
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <Link2 className="h-4 w-4 shrink-0" />
          Links
          {links.length > 0 && <Badge variant="secondary">{links.length}</Badge>}
        </button>
        <Button
          ref={addButtonRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleAddClick}
          aria-label="Add link"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {links.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">No links yet. Add one with +</p>
          ) : (
            links.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                isPending={pendingPreviewIds.has(link.id)}
                onTogglePreview={(show) => togglePreview(link.id, show)}
                onRefreshPreview={() => refreshPreview(link.id, link.url)}
                onEdit={() => handleEditClick(link)}
                onDelete={() => deleteLink(link.id)}
                suppressFocusRestoreRef={suppressFocusRestoreRef}
              />
            ))
          )}
        </div>
      )}

      <AddLinkForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingLink={editingLink}
        anchorRef={addButtonRef}
        onSave={handleSave}
      />
    </div>
  )
}

interface LinkRowProps {
  link: NoteLink
  isPending: boolean
  onTogglePreview: (show: boolean) => void
  onRefreshPreview: () => void
  onEdit: () => void
  onDelete: () => void
  suppressFocusRestoreRef: MutableRefObject<boolean>
}

function LinkRow({
  link,
  isPending,
  onTogglePreview,
  onRefreshPreview,
  onEdit,
  onDelete,
  suppressFocusRestoreRef,
}: LinkRowProps) {
  const domain = getDomain(link.url)
  const hasPreviewData = !!(link.og_title || link.og_description || link.og_image)

  if (link.show_preview && isPending) {
    return <LinkSkeleton />
  }

  if (link.show_preview && hasPreviewData) {
    return (
      <PreviewCard
        link={link}
        domain={domain}
        onTogglePreview={onTogglePreview}
        onRefreshPreview={onRefreshPreview}
        onEdit={onEdit}
        onDelete={onDelete}
        suppressFocusRestoreRef={suppressFocusRestoreRef}
      />
    )
  }

  const noPreviewAvailable = link.show_preview && !hasPreviewData && link.og_fetched_at !== null

  return (
    <BareLinkRow
      link={link}
      domain={domain}
      noPreviewAvailable={noPreviewAvailable}
      onTogglePreview={onTogglePreview}
      onRefreshPreview={onRefreshPreview}
      onEdit={onEdit}
      onDelete={onDelete}
      suppressFocusRestoreRef={suppressFocusRestoreRef}
    />
  )
}

function LinkSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-20 w-20 shrink-0 animate-pulse rounded bg-muted" />
    </div>
  )
}

interface LinkVariantProps {
  link: NoteLink
  domain: string
  onTogglePreview: (show: boolean) => void
  onRefreshPreview: () => void
  onEdit: () => void
  onDelete: () => void
  suppressFocusRestoreRef: MutableRefObject<boolean>
}

function BareLinkRow({
  link,
  domain,
  noPreviewAvailable,
  onTogglePreview,
  onRefreshPreview,
  onEdit,
  onDelete,
  suppressFocusRestoreRef,
}: LinkVariantProps & { noPreviewAvailable: boolean }) {
  return (
    <div className="group flex items-start gap-3 rounded-lg p-2 hover:bg-accent/50">
      <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{link.display_text}</p>
        <p className="truncate text-xs text-muted-foreground">
          {domain}
          {noPreviewAvailable && ' · No preview available'}
        </p>
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="Link actions" className={menuButtonClass}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => {
            if (suppressFocusRestoreRef.current) {
              e.preventDefault()
              suppressFocusRestoreRef.current = false
            }
          }}
        >
          <LinkMenuItems
            link={link}
            showRetry={noPreviewAvailable}
            onTogglePreview={onTogglePreview}
            onRefreshPreview={onRefreshPreview}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function PreviewCard({
  link,
  domain,
  onTogglePreview,
  onRefreshPreview,
  onEdit,
  onDelete,
  suppressFocusRestoreRef,
}: LinkVariantProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-lg border border-border p-3 hover:bg-accent/50"
    >
      {link.og_image && (
        <img
          src={link.og_image}
          alt=""
          className="float-right ml-3 h-20 w-20 rounded object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <p className="pr-6 text-sm font-medium text-foreground">{link.og_title || link.display_text}</p>
      {link.og_description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{link.og_description}</p>
      )}
      <p className="mt-2 flex items-center gap-1 clear-both text-xs text-muted-foreground">
        <Link2 className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {link.display_text} · {domain}
        </span>
      </p>

      <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Link actions"
              onClick={(e) => e.stopPropagation()}
              className={cn(menuButtonClass, 'bg-card shadow-sm')}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => {
              if (suppressFocusRestoreRef.current) {
                e.preventDefault()
                suppressFocusRestoreRef.current = false
              }
            }}
          >
            <LinkMenuItems
              link={link}
              showRefresh
              onTogglePreview={onTogglePreview}
              onRefreshPreview={onRefreshPreview}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </a>
  )
}

interface LinkMenuItemsProps {
  link: NoteLink
  showRefresh?: boolean
  showRetry?: boolean
  onTogglePreview: (show: boolean) => void
  onRefreshPreview: () => void
  onEdit: () => void
  onDelete: () => void
}

function LinkMenuItems({
  link,
  showRefresh,
  showRetry,
  onTogglePreview,
  onRefreshPreview,
  onEdit,
  onDelete,
}: LinkMenuItemsProps) {
  return (
    <>
      <DropdownMenuItem onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Open link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onTogglePreview(!link.show_preview)}>
        {link.show_preview ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide preview
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Show preview
          </>
        )}
      </DropdownMenuItem>
      {(showRefresh || showRetry) && (
        <DropdownMenuItem onClick={onRefreshPreview}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {showRetry ? 'Retry' : 'Refresh preview'}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onEdit}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onDelete}
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  )
}
