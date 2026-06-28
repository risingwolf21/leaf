import { useSyncExternalStore } from 'react'
import type { Editor } from '@tiptap/react'

let activeEditor: Editor | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function setActiveEditor(editor: Editor | null) {
  activeEditor = editor
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useActiveEditor() {
  return useSyncExternalStore(subscribe, () => activeEditor)
}
