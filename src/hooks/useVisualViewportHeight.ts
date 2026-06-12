import { useEffect, useState } from 'react'

export function useVisualViewportHeight() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      document.documentElement.style.setProperty('--app-height', `${viewport.height}px`)
      document.documentElement.style.setProperty('--app-offset-top', `${viewport.offsetTop}px`)
      setKeyboardOpen(viewport.height < window.innerHeight * 0.85)
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return keyboardOpen
}
