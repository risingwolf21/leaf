import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NoteCollaborator, ShareRole } from '@/types'

interface CollaboratorListProps {
  ownerEmail: string
  collaborators: NoteCollaborator[]
  onUpdateRole: (collaboratorId: string, role: ShareRole) => void
  onRemove: (collaboratorId: string) => void
}

const ROLE_LABELS: Record<ShareRole, string> = {
  viewer: 'Can view',
  editor: 'Can edit',
}

function Avatar({ email }: { email: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium uppercase text-secondary-foreground">
      {email.charAt(0)}
    </div>
  )
}

export function CollaboratorList({
  ownerEmail,
  collaborators,
  onUpdateRole,
  onRemove,
}: CollaboratorListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  return (
    <ul className="flex flex-col gap-2">
      <li className="flex items-center gap-3">
        <Avatar email={ownerEmail} />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          {ownerEmail} <span className="text-muted-foreground">(you)</span>
        </p>
        <span className="shrink-0 text-sm text-muted-foreground">Owner</span>
      </li>

      {collaborators.map((collaborator) =>
        removingId === collaborator.id ? (
          <li key={collaborator.id} className="flex items-center gap-3">
            <Avatar email={collaborator.email} />
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">
              Remove {collaborator.email}?
            </p>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setRemovingId(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onRemove(collaborator.id)}>
                Remove
              </Button>
            </div>
          </li>
        ) : (
          <li key={collaborator.id} className="flex items-center gap-3">
            <Avatar email={collaborator.email} />
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{collaborator.email}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 gap-1">
                  {ROLE_LABELS[collaborator.role]}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={collaborator.role}
                  onValueChange={(value) => onUpdateRole(collaborator.id, value as ShareRole)}
                >
                  <DropdownMenuRadioItem value="viewer">Can view</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="editor">Can edit</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => setRemovingId(collaborator.id)}
                >
                  Remove access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )
      )}
    </ul>
  )
}
