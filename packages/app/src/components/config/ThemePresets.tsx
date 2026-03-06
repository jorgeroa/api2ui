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
  rose: {
    colors: ['#f7eef2', '#4a2035', '#f0d8e4'],
    name: 'Rose',
    variant: 'Light',
  },
  slate: {
    colors: ['#2a2d35', '#e8e9ec', '#3a3d45'],
    name: 'Slate',
    variant: 'Dark',
  },
  sunset: {
    colors: ['#f7f0e5', '#4a2810', '#f0d8b8'],
    name: 'Sunset',
    variant: 'Light',
  },
  nord: {
    colors: ['#2e3440', '#d8dee9', '#3b4252'],
    name: 'Nord',
    variant: 'Dark',
  },
}

const PRESETS: ThemePreset[] = ['light', 'dark', 'midnight', 'forest', 'sand', 'ocean', 'rose', 'slate', 'sunset', 'nord']

function PresetCard({ preset, selected, onClick }: { preset: ThemePreset; selected: boolean; onClick: () => void }) {
  const config = THEME_CONFIGS[preset]

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg border-2 transition-all hover:shadow-md ${
        selected
          ? 'border-foreground ring-1 ring-ring'
          : 'border-border hover:border-foreground/20'
      }`}
      aria-label={`Select ${config.name} theme`}
      aria-pressed={selected}
    >
      {/* Color preview strip */}
      <div className="flex gap-0.5 mb-1.5">
        {config.colors.map((color, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Name */}
      <div className="text-[10px] font-medium text-foreground text-center leading-tight">
        {config.name}
      </div>
    </button>
  )
}

export function ThemePresets() {
  const { globalTheme, applyTheme } = useConfigStore()

  return (
    <div className="grid grid-cols-5 gap-2">
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
