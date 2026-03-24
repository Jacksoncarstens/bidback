// Lightweight theme provider — applies 'dark' class to <html> element.
// Tailwind's darkMode: 'class' picks this up automatically.
// Persists choice to localStorage; defaults to system preference.
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} })

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('bidback_theme') as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  function setTheme(t: Theme) {
    try { localStorage.setItem('bidback_theme', t) } catch { /* storage blocked */ }
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
