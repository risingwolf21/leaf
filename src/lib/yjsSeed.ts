import { Editor } from '@tiptap/core'
import * as Y from 'yjs'
import { prosemirrorJSONToYDoc } from 'y-prosemirror'
import { createEditorExtensions } from '@/lib/editor-extensions'
import { supabase } from '@/lib/supabase'
import { YJS_FIELD, base64ToBytes, bytesToBase64 } from '@/lib/yjsState'

function decodeYDoc(base64State: string): Y.Doc {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, base64ToBytes(base64State))
  return doc
}

function markdownToYDoc(markdown: string): Y.Doc {
  const editor = new Editor({ extensions: createEditorExtensions(), content: markdown })
  const doc = prosemirrorJSONToYDoc(editor.schema, editor.getJSON(), YJS_FIELD)
  editor.destroy()
  return doc
}

/**
 * Loads a note's Yjs doc from its persisted CRDT state, or — the first time a
 * note becomes collaborative — seeds one from its markdown. Two clients can
 * race to seed the same note at once; Yjs only merges *operations*, so two
 * independently-seeded docs would silently diverge instead of merging. The
 * conditional update below (`is('ydoc_state', null)`) lets only one seed win;
 * the loser re-reads and adopts the winner's state instead of its own.
 */
export async function loadOrSeedYDoc(
  noteId: string,
  ydocState: string | null,
  markdown: string
): Promise<Y.Doc> {
  if (ydocState) return decodeYDoc(ydocState)

  const seeded = markdownToYDoc(markdown)
  const encoded = bytesToBase64(Y.encodeStateAsUpdate(seeded))

  const { data: won } = await supabase
    .from('notes')
    .update({ ydoc_state: encoded })
    .eq('id', noteId)
    .is('ydoc_state', null)
    .select('id')

  if (won && won.length > 0) return seeded

  const { data: existing } = await supabase
    .from('notes')
    .select('ydoc_state')
    .eq('id', noteId)
    .single()

  return existing?.ydoc_state ? decodeYDoc(existing.ydoc_state) : seeded
}
