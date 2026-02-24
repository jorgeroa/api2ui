import { useConfigStore } from '../../store/configStore'

export function DrilldownModeToggle() {
  const { drilldownMode, setDrilldownMode } = useConfigStore()

  return (
    <div className="inline-flex border border-border rounded-lg text-xs" role="group" aria-label="Drilldown mode">
      <button
        onClick={() => setDrilldownMode('page')}
        title="Navigate in-page"
        className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-l-lg ${
          drilldownMode === 'page'
            ? 'bg-background text-foreground shadow-sm font-medium'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Page
      </button>
      <button
        onClick={() => setDrilldownMode('dialog')}
        title="Open in dialog"
        className={`p-2 border-l border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
          drilldownMode === 'dialog'
            ? 'bg-background text-foreground shadow-sm font-medium'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Dialog
      </button>
      <button
        onClick={() => setDrilldownMode('panel')}
        title="Open in side panel"
        className={`p-2 border-l border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-r-lg ${
          drilldownMode === 'panel'
            ? 'bg-background text-foreground shadow-sm font-medium'
            : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Panel
      </button>
    </div>
  )
}
