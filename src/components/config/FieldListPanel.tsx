import { useConfigStore } from '../../store/configStore'
import { EditableLabel } from './EditableLabel'

interface FieldInfo {
  path: string
  name: string
}

interface FieldListPanelProps {
  fields: FieldInfo[]
}

export function FieldListPanel({ fields }: FieldListPanelProps) {
  const { fieldConfigs, toggleFieldVisibility, setFieldLabel } = useConfigStore()

  // Calculate visible count
  const visibleCount = fields.filter((field) => {
    const config = fieldConfigs[field.path]
    return config?.visible !== false
  }).length

  // Group fields by depth (count dots in path after $)
  const getDepth = (path: string): number => {
    const withoutRoot = path.replace(/^\$\.?/, '')
    if (!withoutRoot) return 0
    return (withoutRoot.match(/\./g) || []).length
  }

  // Sort fields: by depth first, then alphabetically
  const sortedFields = [...fields].sort((a, b) => {
    const depthA = getDepth(a.path)
    const depthB = getDepth(b.path)
    if (depthA !== depthB) return depthA - depthB
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-3">
      {/* Count summary */}
      <div className="text-sm text-gray-600">
        {visibleCount} of {fields.length} fields visible
      </div>

      {/* Field list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedFields.map((field) => {
          const config = fieldConfigs[field.path]
          const isVisible = config?.visible !== false
          const customLabel = config?.label
          const depth = getDepth(field.path)

          return (
            <div
              key={field.path}
              className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded"
              style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleFieldVisibility(field.path)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label={`Toggle visibility for ${field.name}`}
              />

              {/* Label section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <EditableLabel
                    value={customLabel || field.name}
                    originalName={field.name}
                    fieldPath={field.path}
                    onChange={(newLabel) => setFieldLabel(field.path, newLabel)}
                  />
                </div>

                {/* Show path for deeply nested fields */}
                {depth > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate" title={field.path}>
                    {field.path}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-gray-500 italic py-4 text-center">
          No fields to configure
        </div>
      )}
    </div>
  )
}
