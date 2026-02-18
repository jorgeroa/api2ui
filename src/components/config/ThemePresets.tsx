import { useConfigStore } from '../../store/configStore'
import type { ThemePreset } from '../../types/config'

interface ThemeConfig {
  colors: string[]
  name: string
  variant: 'Light' | 'Dark'
}

const THEME_CONFIGS: Record<ThemePreset, ThemeConfig> = {
  light: {
    colors: ['#fafafa', '#1a1a1a', '#e5e5e5'],
    name: 'Light',
    variant: 'Light',
  },
  dark: {
    colors: ['#1a1a1a', '#fafafa', '#333333'],
    name: 'Dark',
    variant: 'Dark',
  },
  midnight: {
    colors: ['#1e2340', '#e0e4f0', '#2d3460'],
    name: 'Midnight',
    variant: 'Dark',
  },
  forest: {
    colors: ['#1a2e1f', '#dce8df', '#2a4030'],
    name: 'Forest',
    variant: 'Dark',
  },
  sand: {
    colors: ['#f5f0e8', '#3d3020', '#e8e0d0'],
    name: 'Sand',
    variant: 'Light',
  },
  ocean: {
    colors: ['#eef2f7', '#1e2d40', '#d8e0ec'],
    name: 'Ocean',
    variant: 'Light',
  },
}

const PRESETS: ThemePreset[] = ['light', 'dark', 'midnight', 'forest', 'sand', 'ocean']

function PresetCard({ preset, selected, onClick }: { preset: ThemePreset; selected: boolean; onClick: () => void }) {
  const config = THEME_CONFIGS[preset]

  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
        selected
          ? 'border-foreground ring-1 ring-ring'
          : 'border-border hover:border-foreground/20'
      }`}
      aria-label={`Select ${config.name} theme`}
      aria-pressed={selected}
    >
      {/* Color preview strip */}
      <div className="flex gap-1 mb-2">
        {config.colors.map((color, i) => (
          <div
            key={i}
            className="h-5 flex-1 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Name and variant label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{config.name}</span>
        <span className="text-[10px] text-muted-foreground">{config.variant}</span>
      </div>
    </button>
  )
}

export function ThemePresets() {
  const { globalTheme, applyTheme } = useConfigStore()

  return (
    <div className="grid grid-cols-3 gap-2">
      {PRESETS.map((preset) => (
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
