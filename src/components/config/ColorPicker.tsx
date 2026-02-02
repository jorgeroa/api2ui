interface ColorPickerProps {
  label: string
  value: string
  cssVar: string
  onChange: (color: string) => void
}

const CURATED_PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#6366f1', // indigo
]

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Curated swatches */}
      <div className="grid grid-cols-4 gap-2">
        {CURATED_PALETTE.map((color) => {
          const isSelected = value === color
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`w-8 h-8 rounded transition-all ${
                isSelected
                  ? 'ring-2 ring-gray-900 ring-offset-2 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${label} color ${color}`}
              aria-pressed={isSelected}
            />
          )
        })}
      </div>

      {/* Custom color input */}
      <div className="flex items-center gap-2 pt-1">
        <label htmlFor={`custom-${label}`} className="text-xs text-gray-600">
          Custom:
        </label>
        <input
          id={`custom-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
          aria-label={`Custom ${label} color`}
        />
        <span className="text-xs text-gray-500 font-mono">{value}</span>
      </div>
    </div>
  )
}
