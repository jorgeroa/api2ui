import { useConfigStore } from '../../store/configStore'

/**
 * ComponentOverridePanel lists all active component overrides.
 * Provides Change and Revert buttons for each override.
 */
export function ComponentOverridePanel() {
  const { fieldConfigs, setFieldComponentType } = useConfigStore()

  // Find all fields with componentType set
  const overrides = Object.entries(fieldConfigs)
    .filter(([_, config]) => config.componentType !== undefined)
    .map(([path, config]) => ({
      path,
      componentType: config.componentType!,
    }))

  if (overrides.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No component overrides. Enter Configure mode to change component types.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {overrides.map(({ path, componentType }) => (
        <div
          key={path}
          className="border border-border rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate" title={path}>
              {path}
            </div>
            <div className="text-xs text-muted-foreground">
              Override: <span className="font-mono">{componentType}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => {
                document.dispatchEvent(new CustomEvent('api2ui:open-picker', { detail: { fieldPath: path } }))
              }}
              className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            >
              Change
            </button>

            {/* Revert button */}
            <button
              onClick={() => {
                // Clear the componentType by setting it to undefined
                const { [path]: config } = fieldConfigs
                const updatedConfig = { ...config }
                delete updatedConfig.componentType
                setFieldComponentType(path, undefined as any)
              }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Revert
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
