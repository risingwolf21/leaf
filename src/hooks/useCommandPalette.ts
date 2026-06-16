import { useEffect, useSyncExternalStore } from 'react'

let open = false
const listeners = new Set<() => void>()

function setOpen(next: boolean | ((prev: boolean) => boolean)) {
  open = typeof next === 'function' ? next(open) : next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCommandPalette() {
  const isOpen = useSyncExternalStore(subscribe, () => open)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open: isOpen, setOpen }
}

/** Open the command palette from anywhere without subscribing to its state. */
export function openCommandPalette() {
  setOpen(true)
}
