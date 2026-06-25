import { useEffect, useState } from 'react'

function readHeight(): number | undefined {
  return window.visualViewport?.height
}

/**
 * Tracks `window.visualViewport.height`, which shrinks when the on-screen
 * keyboard opens on iOS Safari — unlike `dvh`, which iOS never resizes for
 * the keyboard, leaving sticky headers stranded above the visible area.
 * Returns undefined where the API is unsupported, so callers can fall back
 * to a CSS-only height.
 */
export function useVisualViewportHeight(): number | undefined {
  const [height, setHeight] = useState(readHeight)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => setHeight(viewport.height)
    viewport.addEventListener('resize', handleResize)
    return () => viewport.removeEventListener('resize', handleResize)
  }, [])

  return height
}
