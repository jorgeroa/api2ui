export interface FieldConfig {
  visible: boolean
  label?: string           // custom display label (undefined = use original)
  componentType?: string   // override component type (undefined = use default)
  order: number            // sort order for drag-and-drop reordering
}

export type ThemePreset = 'light' | 'dark' | 'compact' | 'spacious'

export interface StyleOverrides {
  '--color-primary'?: string
  '--color-secondary'?: string
  '--color-background'?: string
  '--color-text'?: string
  '--color-surface'?: string
  '--color-border'?: string
  '--spacing-row'?: string
  '--font-family'?: string
  '--font-size-base'?: string
  '--border-radius-base'?: string
  [key: `--${string}`]: string | undefined  // allow additional CSS vars
}

export type DrilldownMode = 'page' | 'dialog'

export interface PaginationConfig {
  itemsPerPage: number
  currentPage: number
}

export interface ConfigState {
  mode: 'configure' | 'view'
  drilldownMode: DrilldownMode
  fieldConfigs: Record<string, FieldConfig>
  globalTheme: ThemePreset
  styleOverrides: StyleOverrides
  endpointOverrides: Record<string, StyleOverrides>
  panelOpen: boolean
  paginationConfigs: Record<string, PaginationConfig>  // keyed by field path (e.g., "$")
}
