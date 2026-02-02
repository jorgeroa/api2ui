import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { useConfigStore } from '../../store/configStore'
import { FieldControls } from '../config/FieldControls'

/** Chevron icon that rotates when disclosure is open */
function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 transition-transform ui-open:rotate-180"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Get a summary label for a nested field */
function getFieldSummary(fieldDef: { type: { kind: string } }, value: unknown): string {
  if (fieldDef.type.kind === 'array') {
    const length = Array.isArray(value) ? value.length : 0
    return `(${length} items)`
  }
  return '(object)'
}

export function DetailRenderer({ data, schema, path, depth }: RendererProps) {
  const { mode, fieldConfigs } = useConfigStore()

  if (schema.kind !== 'object') {
    return <div className="text-red-500">DetailRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">DetailRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const allFields = Array.from(schema.fields.entries())

  if (allFields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  // Apply field ordering: sort by order if set, maintain original order otherwise
  const sortedFields = [...allFields].sort((a, b) => {
    const pathA = `${path}.${a[0]}`
    const pathB = `${path}.${b[0]}`
    const configA = fieldConfigs[pathA]
    const configB = fieldConfigs[pathB]

    const orderA = configA?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = configB?.order ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Preserve original order for fields with same/no order
    return allFields.findIndex(f => f[0] === a[0]) - allFields.findIndex(f => f[0] === b[0])
  })

  // Filter fields based on visibility in View mode
  const isConfigureMode = mode === 'configure'
  const visibleFields = isConfigureMode
    ? sortedFields  // Show all in Configure mode
    : sortedFields.filter(([fieldName]) => {
        const fieldPath = `${path}.${fieldName}`
        const config = fieldConfigs[fieldPath]
        return config?.visible !== false
      })

  if (visibleFields.length === 0 && !isConfigureMode) {
    return <div className="text-gray-500 italic">All fields hidden</div>
  }

  return (
    <div className="space-y-3 border border-gray-200 rounded-lg p-4">
      {visibleFields.map(([fieldName, fieldDef]) => {
        const value = obj[fieldName]
        const fieldPath = `${path}.${fieldName}`
        const config = fieldConfigs[fieldPath]
        const isVisible = config?.visible !== false

        // Format label: use custom label if set, otherwise auto-format
        const defaultLabel = fieldName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
        const displayLabel = config?.label || defaultLabel

        // Render primitive fields inline
        if (fieldDef.type.kind === 'primitive') {
          const fieldContent = (
            <div className="grid grid-cols-[auto_1fr] gap-x-6">
              <div className="text-sm font-medium text-gray-600 py-1">
                {displayLabel}:
              </div>
              <div className="py-1">
                <PrimitiveRenderer
                  data={value}
                  schema={fieldDef.type}
                  path={fieldPath}
                  depth={depth + 1}
                />
              </div>
            </div>
          )

          // In Configure mode: wrap with FieldControls
          if (isConfigureMode) {
            return (
              <FieldControls
                key={fieldName}
                fieldPath={fieldPath}
                fieldName={fieldName}
                isVisible={isVisible}
                customLabel={config?.label}
              >
                {fieldContent}
              </FieldControls>
            )
          }

          return <div key={fieldName}>{fieldContent}</div>
        }

        // Render nested objects/arrays as collapsible sections
        const nestedContent = (
          <Disclosure defaultOpen={depth === 0}>
            <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
              <ChevronIcon />
              {displayLabel} {getFieldSummary(fieldDef, value)}
            </DisclosureButton>
            <DisclosurePanel className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
              <DynamicRenderer
                data={value}
                schema={fieldDef.type}
                path={fieldPath}
                depth={depth + 1}
              />
            </DisclosurePanel>
          </Disclosure>
        )

        // In Configure mode: wrap with FieldControls
        if (isConfigureMode) {
          return (
            <FieldControls
              key={fieldName}
              fieldPath={fieldPath}
              fieldName={fieldName}
              isVisible={isVisible}
              customLabel={config?.label}
            >
              {nestedContent}
            </FieldControls>
          )
        }

        return <div key={fieldName}>{nestedContent}</div>
      })}
    </div>
  )
}
