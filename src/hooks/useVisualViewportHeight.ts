import { useEffect } from 'react'

export function useVisualViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      document.documentElement.style.setProperty('--app-height', `${viewport.height}px`)
    }

    update()
    viewport.addEventListener('resize', update)
    return () => viewport.removeEventListener('resize', update)
  }, [])
}
