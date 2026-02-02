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
      <div className="text-sm text-gray-500 italic">
        No component overrides. Enter Configure mode to change component types.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {overrides.map(({ path, componentType }) => (
        <div
          key={path}
          className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate" title={path}>
              {path}
            </div>
            <div className="text-xs text-gray-600">
              Override: <span className="font-mono">{componentType}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* TODO: Change button - would open ComponentPicker */}
            {/* <button
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Change
            </button> */}

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
