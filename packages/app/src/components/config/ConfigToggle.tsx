import { useConfigStore } from '../../store/configStore'

export function ConfigToggle() {
  const { mode, setMode, togglePanel, getHiddenFieldCount } = useConfigStore()
  const hiddenCount = getHiddenFieldCount()

  const handleToggle = () => {
    if (mode === 'view') {
      setMode('configure')
      // Auto-open panel on first entry to configure mode
      togglePanel()
    } else {
      setMode('view')
    }
  }

  const isConfigureMode = mode === 'configure'

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      {/* Settings panel trigger - shown in configure mode */}
      {isConfigureMode && (
        <button
          onClick={togglePanel}
          className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
          aria-label="Open settings panel"
        >
          Settings
        </button>
      )}

      {/* Main toggle button */}
      <button
        onClick={handleToggle}
        className="group relative w-14 h-14 rounded-full shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-label={isConfigureMode ? 'Exit configure mode' : 'Configure view'}
        title={isConfigureMode ? 'Exit configure mode' : 'Configure view'}
      >
        {/* Gear icon SVG */}
        <svg
          className="w-7 h-7 mx-auto group-hover:rotate-45 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>

        {/* Badge for hidden fields count */}
        {hiddenCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {hiddenCount}
          </span>
        )}
      </button>
    </div>
  )
}
