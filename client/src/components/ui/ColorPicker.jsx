import { useState } from 'react'

export function ColorPicker({ value, onChange, label }) {
  const [inputValue, setInputValue] = useState(value || '#000000')

  const handleChange = (newValue) => {
    setInputValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-zinc-700"
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 text-sm rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
      </div>
    </div>
  )
}
