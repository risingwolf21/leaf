import type { User } from '@supabase/supabase-js'
import { useCollaborators } from '@/hooks/useCollaborators'
import { useYjsDoc } from '@/hooks/useYjsDoc'
import { useYjsBroadcastSync } from '@/hooks/useYjsBroadcastSync'
import { awarenessColor } from '@/lib/yjsState'
import type { CollaborationConfig, Note } from '@/types'

type NoteCollaboration = {
  isCollaborative: boolean
  collaboration: CollaborationConfig | undefined
}

/** Binds a note to a shared Yjs document for live multi-user editing when it's shared or has collaborators. */
export function useNoteCollaboration(note: Note | null, isShared: boolean, user: User | null): NoteCollaboration {
  const { collaborators } = useCollaborators(note?.id ?? null)
  const isCollaborative = isShared || collaborators.length > 0

  const { ydoc, awareness, isReady } = useYjsDoc(
    note?.id ?? '',
    note?.ydoc_state ?? null,
    note?.content ?? '',
    isCollaborative && !!note
  )
  useYjsBroadcastSync(note?.id ?? '', ydoc, awareness)

  const collaboration: CollaborationConfig | undefined =
    ydoc && awareness && isReady && user
      ? { ydoc, awareness, user: { name: user.email ?? 'Anonymous', color: awarenessColor(user.id) } }
      : undefined

  return { isCollaborative, collaboration }
}
