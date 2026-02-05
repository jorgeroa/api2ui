import { useConfigStore } from '../../store/configStore'

export function DrilldownModeToggle() {
  const { drilldownMode, setDrilldownMode } = useConfigStore()

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">Click:</span>
      <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
        <button
          onClick={() => setDrilldownMode('page')}
          className={`px-2.5 py-1 transition-colors ${
            drilldownMode === 'page'
              ? 'bg-blue-100 text-blue-800 font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Page
        </button>
        <button
          onClick={() => setDrilldownMode('dialog')}
          className={`px-2.5 py-1 border-l border-gray-300 transition-colors ${
            drilldownMode === 'dialog'
              ? 'bg-blue-100 text-blue-800 font-medium'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Dialog
        </button>
      </div>
    </div>
  )
}
