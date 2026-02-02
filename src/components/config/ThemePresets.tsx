import { useConfigStore } from '../../store/configStore'
import type { ThemePreset } from '../../types/config'

interface PresetCardProps {
  preset: ThemePreset
  selected: boolean
  onClick: () => void
}

function PresetCard({ preset, selected, onClick }: PresetCardProps) {
  const presetConfig: Record<ThemePreset, { colors: string[]; name: string; description: string }> = {
    light: {
      colors: ['#3b82f6', '#f3f4f6', '#1f2937'],
      name: 'Light',
      description: 'Clean and bright'
    },
    dark: {
      colors: ['#6366f1', '#1f2937', '#f3f4f6'],
      name: 'Dark',
      description: 'Easy on the eyes'
    },
    compact: {
      colors: ['#8b5cf6', '#fafafa', '#374151'],
      name: 'Compact',
      description: 'Dense information'
    },
    spacious: {
      colors: ['#10b981', '#ffffff', '#111827'],
      name: 'Spacious',
      description: 'Plenty of breathing room'
    }
  }

  const config = presetConfig[preset]

  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
        selected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      aria-label={`Select ${config.name} theme preset`}
      aria-pressed={selected}
    >
      {/* Color preview */}
      <div className="flex gap-1 mb-2">
        {config.colors.map((color, i) => (
          <div
            key={i}
            className="h-6 flex-1 rounded"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Name and description */}
      <div className="text-left">
        <div className="text-sm font-semibold text-gray-900">{config.name}</div>
        <div className="text-xs text-gray-500">{config.description}</div>
      </div>
    </button>
  )
}

export function ThemePresets() {
  const { globalTheme, applyTheme } = useConfigStore()

  const presets: ThemePreset[] = ['light', 'dark', 'compact', 'spacious']

  return (
    <div className="grid grid-cols-2 gap-3">
      {presets.map((preset) => (
        <PresetCard
          key={preset}
          preset={preset}
          selected={globalTheme === preset}
          onClick={() => applyTheme(preset)}
        />
      ))}
    </div>
  )
}
