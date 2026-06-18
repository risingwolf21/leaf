import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { loadOrSeedYDoc } from '@/lib/yjsSeed'

type YjsDocState = {
  ydoc: Y.Doc | null
  awareness: Awareness | null
  isReady: boolean
}

const EMPTY_STATE: YjsDocState = { ydoc: null, awareness: null, isReady: false }

/** Owns a note's Yjs document + awareness instance, seeded from its persisted CRDT state or markdown. */
export function useYjsDoc(noteId: string, ydocState: string | null, markdown: string, enabled: boolean) {
  const [state, setState] = useState<YjsDocState>(EMPTY_STATE)

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE)
      return
    }

    let cancelled = false
    let doc: Y.Doc | null = null
    let awareness: Awareness | null = null

    loadOrSeedYDoc(noteId, ydocState, markdown).then((loadedDoc) => {
      if (cancelled) {
        loadedDoc.destroy()
        return
      }
      doc = loadedDoc
      awareness = new Awareness(doc)
      setState({ ydoc: doc, awareness, isReady: true })
    })

    return () => {
      cancelled = true
      awareness?.destroy()
      doc?.destroy()
      setState(EMPTY_STATE)
    }
    // ydocState/markdown intentionally excluded: only the initial seed matters,
    // ongoing edits flow through the Yjs doc itself, not these props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, enabled])

  return state
}
