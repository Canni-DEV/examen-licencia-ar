import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'theme'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prefersDark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
    setDark(prefersDark)
  }, [])

  const toggle = () => {
    const newDark = !dark
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem(STORAGE_KEY, newDark ? 'dark' : 'light')
    setDark(newDark)
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  )
}

