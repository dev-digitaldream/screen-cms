import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { Tooltip } from './Tooltip'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Tooltip content={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
      <button
        onClick={toggleTheme}
        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-700 dark:text-zinc-300"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </Tooltip>
  )
}
