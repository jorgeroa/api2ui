import { useConfigStore } from '../../store/configStore'

export function DrilldownModeToggle() {
  const { drilldownMode, setDrilldownMode } = useConfigStore()

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Click:</span>
      <div className="inline-flex rounded-md border border-border overflow-hidden">
        <button
          onClick={() => setDrilldownMode('page')}
          className={`px-2.5 py-1 transition-colors ${
            drilldownMode === 'page'
              ? 'bg-muted text-muted-foreground font-medium'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          Page
        </button>
        <button
          onClick={() => setDrilldownMode('dialog')}
          className={`px-2.5 py-1 border-l border-border transition-colors ${
            drilldownMode === 'dialog'
              ? 'bg-muted text-muted-foreground font-medium'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          Dialog
        </button>
        <button
          onClick={() => setDrilldownMode('panel')}
          className={`px-2.5 py-1 border-l border-border transition-colors ${
            drilldownMode === 'panel'
              ? 'bg-muted text-muted-foreground font-medium'
              : 'bg-background text-muted-foreground hover:bg-muted'
          }`}
        >
          Panel
        </button>
      </div>
    </div>
  )
}
