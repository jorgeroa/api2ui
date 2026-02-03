import { useConfigStore } from '../../store/configStore'
import { EditableLabel } from './EditableLabel'

interface FieldInfo {
  path: string
  name: string
}

interface FieldListPanelProps {
  fields: FieldInfo[]
  onConfigureField?: (fieldPath: string) => void
}

export function FieldListPanel({ fields, onConfigureField }: FieldListPanelProps) {
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
              data-field-path={field.path}
              className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded transition-all"
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

              {/* Configure in context button */}
              {onConfigureField && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigureField(field.path)
                  }}
                  className="mt-0.5 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                  title="Configure in context"
                  aria-label={`Configure ${field.name} in context`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
                  </svg>
                </button>
              )}
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
