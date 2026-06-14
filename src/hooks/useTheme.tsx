import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

interface ThemeContextValue {
  /** The resolved theme actually applied to the document (system preference resolved to light/dark). */
  theme: Theme
  /** The user's stored preference, which may be 'system'. */
  themePreference: ThemePreference
  setThemePreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'leaf-theme'

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored

  return 'system'
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialPreference)
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themePreference))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    setTheme(resolveTheme(themePreference))

    if (themePreference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(resolveTheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themePreference])

  const setThemePreference = useCallback((preference: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, preference)
    setThemePreferenceState(preference)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
