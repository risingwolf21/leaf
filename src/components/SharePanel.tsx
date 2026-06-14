import { useEffect, useState } from 'react'
import { ChevronDown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CollaboratorList } from '@/components/CollaboratorList'
import { useAuth } from '@/hooks/useAuth'
import { useCollaborators } from '@/hooks/useCollaborators'
import { formatDate } from '@/lib/utils'
import type { Note, NoteFields, ShareRole } from '@/types'
import { Toggle } from './ui/toggle'

type SharePanelProps = {
  note: Note
  onShare: (id: string) => Promise<string>
  onUnshare: (id: string) => Promise<void>
  onChange: (id: string, fields: NoteFields) => void
}

const ROLE_LABELS: Record<ShareRole, string> = {
  viewer: 'Can view',
  editor: 'Can edit',
}

function shareUrlFromToken(token: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}`
}

export function SharePanel({ note, onShare, onUnshare, onChange }: SharePanelProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { collaborators, addCollaborator, updateCollaboratorRole, removeCollaborator } =
    useCollaborators(note.id)

  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ShareRole>('viewer')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareToken = note.share_token
  const isShared = shareToken !== null || collaborators.length > 0

  useEffect(() => {
    if (!open) {
      setEmail('')
      setInviteError(null)
      setCopied(false)
    }
  }, [open])

  const handleInvite = async () => {
    const trimmed = email.trim()
    if (!trimmed) return

    setInviting(true)
    setInviteError(null)

    try {
      await addCollaborator(trimmed, inviteRole)
      setEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not share this note. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  const handleEnableLink = async () => {
    setCreatingLink(true)
    await onShare(note.id)
    setCreatingLink(false)
  }

  const handleDisableLink = async () => {
    await onUnshare(note.id)
  }

  const handleCopy = async () => {
    if (!shareToken) return
    await navigator.clipboard.writeText(shareUrlFromToken(shareToken))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Toggle size="sm" pressed={isShared} aria-label="Share note">
          <Share2 className="h-4 w-4" />
        </Toggle>}>
        
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="min-w-0 flex-1 truncate pr-6">Share “{note.title || 'Untitled'}”</DialogTitle>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Share with people</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInvite()
                }}
                placeholder="Email address"
                className="min-w-0 flex-1"
              />
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger render={ <Button variant="outline" size="sm" className="shrink-0 gap-1">
                      {ROLE_LABELS[inviteRole]}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>}>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={inviteRole}
                      onValueChange={(value) => setInviteRole(value as ShareRole)}
                    >
                      <DropdownMenuRadioItem value="viewer">Can view</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="editor">Can edit</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={inviting || !email.trim()}
                  className="flex-1 sm:flex-initial"
                >
                  {inviting ? 'Inviting…' : 'Invite'}
                </Button>
              </div>
            </div>
            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">People with access</h3>
            <CollaboratorList
              ownerEmail={user?.email ?? ''}
              collaborators={collaborators}
              onUpdateRole={updateCollaboratorRole}
              onRemove={removeCollaborator}
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Link sharing</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={shareToken === null ? 'secondary' : 'outline'}
                onClick={handleDisableLink}
                disabled={shareToken === null}
              >
                Off
              </Button>
              <Button
                size="sm"
                variant={shareToken !== null ? 'secondary' : 'outline'}
                onClick={handleEnableLink}
                disabled={creatingLink || shareToken !== null}
              >
                {creatingLink ? 'Creating…' : 'Anyone with the link'}
              </Button>
            </div>

            {shareToken !== null && (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="shrink-0 gap-1">
                        {ROLE_LABELS[note.share_link_role]}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>}>
                      
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup
                        value={note.share_link_role}
                        onValueChange={(value) =>
                          onChange(note.id, { share_link_role: value as ShareRole })
                        }
                      >
                        <DropdownMenuRadioItem value="viewer">Can view</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="editor">Can edit</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Input readOnly value={shareUrlFromToken(shareToken)} className="min-w-0 flex-1 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                    {copied ? 'Copied!' : 'Copy link'}
                  </Button>
                </div>
                {note.shared_at && (
                  <p className="text-xs text-muted-foreground">Shared on {formatDate(note.shared_at)}</p>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
