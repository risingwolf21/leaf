import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Toggle } from '@/components/ui/toggle'
import { formatDate } from '@/lib/utils'
import type { Note } from '@/types'

interface SharePopoverProps {
  note: Note
  onShare: (id: string) => Promise<string>
  onUnshare: (id: string) => Promise<void>
}

function shareUrlFromToken(token: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}`
}

export function SharePopover({ note, onShare, onUnshare }: SharePopoverProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareToken = note.share_token

  const handleCreate = async () => {
    setCreating(true)
    await onShare(note.id)
    setCreating(false)
  }

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(shareUrlFromToken(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    await onUnshare(note.id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={shareToken !== null} aria-label="Share note">
          <Share2 className="h-4 w-4" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">Share this note</h3>
            {shareToken !== null && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />}
          </div>

          {shareToken === null ? (
            <>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this note. They cannot edit it.
              </p>
              <Button size="sm" onClick={handleCreate} disabled={creating} className="self-end">
                {creating ? 'Creating…' : 'Create share link'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Input readOnly value={shareUrlFromToken(shareToken)} className="text-xs" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(shareToken)}
                  className="shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </Button>
              </div>
              {note.shared_at && (
                <p className="text-xs text-muted-foreground">Shared on {formatDate(note.shared_at)}</p>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start text-destructive hover:text-destructive"
                  >
                    Revoke link
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke this link?</AlertDialogTitle>
                    <AlertDialogDescription>Anyone with it will lose access.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevoke}>Revoke</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
