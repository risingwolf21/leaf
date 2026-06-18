import { useEffect } from 'react'
import * as Y from 'yjs'
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness'
import { supabase } from '@/lib/supabase'
import { REMOTE_ORIGIN, base64ToBytes, bytesToBase64 } from '@/lib/yjsState'

type SyncPayload = { update: string }

/** Relays a note's Yjs doc updates and awareness (cursor) state to other connected collaborators in real time. */
export function useYjsBroadcastSync(noteId: string, ydoc: Y.Doc | null, awareness: Awareness | null) {
  useEffect(() => {
    if (!ydoc || !awareness) return

    const channel = supabase.channel(`note:${noteId}`, { config: { private: true } })

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === REMOTE_ORIGIN) return
      void channel.send({
        type: 'broadcast',
        event: 'doc-update',
        payload: { update: bytesToBase64(update) } satisfies SyncPayload,
      })
    }

    const handleAwarenessUpdate = (
      {
        added,
        updated,
        removed,
      }: {
        added: number[]
        updated: number[]
        removed: number[]
      },
      origin: unknown
    ) => {
      if (origin === REMOTE_ORIGIN) return
      const changedClients = [...added, ...updated, ...removed]
      const update = encodeAwarenessUpdate(awareness, changedClients)
      void channel.send({
        type: 'broadcast',
        event: 'awareness-update',
        payload: { update: bytesToBase64(update) } satisfies SyncPayload,
      })
    }

    ydoc.on('update', handleDocUpdate)
    awareness.on('update', handleAwarenessUpdate)

    channel
      .on('broadcast', { event: 'doc-update' }, ({ payload }: { payload: SyncPayload }) => {
        Y.applyUpdate(ydoc, base64ToBytes(payload.update), REMOTE_ORIGIN)
      })
      .on('broadcast', { event: 'awareness-update' }, ({ payload }: { payload: SyncPayload }) => {
        applyAwarenessUpdate(awareness, base64ToBytes(payload.update), REMOTE_ORIGIN)
      })
      .on('broadcast', { event: 'sync-request' }, () => {
        const update = bytesToBase64(Y.encodeStateAsUpdate(ydoc))
        void channel.send({ type: 'broadcast', event: 'doc-update', payload: { update } satisfies SyncPayload })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.send({ type: 'broadcast', event: 'sync-request', payload: {} })
      })

    return () => {
      ydoc.off('update', handleDocUpdate)
      awareness.off('update', handleAwarenessUpdate)
      awareness.setLocalState(null)
      void channel.unsubscribe()
    }
  }, [noteId, ydoc, awareness])
}
