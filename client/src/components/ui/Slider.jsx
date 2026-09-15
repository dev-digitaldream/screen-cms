export function Slider({ value, onChange, min = 0, max = 100, step = 1, label }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {label && <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</label>}
        <span className="text-xs font-mono text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 px-2 py-1 rounded">
          {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  )
}
