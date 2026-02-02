import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'

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
  if (schema.kind !== 'object') {
    return <div className="text-red-500">DetailRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">DetailRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const fields = Array.from(schema.fields.entries())

  if (fields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  return (
    <div className="space-y-3 border border-gray-200 rounded-lg p-4">
      {fields.map(([fieldName, fieldDef]) => {
        const value = obj[fieldName]
        const fieldPath = `${path}.${fieldName}`

        // Format label: capitalize first letter, replace underscores with spaces
        const label = fieldName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())

        // Render primitive fields inline
        if (fieldDef.type.kind === 'primitive') {
          return (
            <div key={fieldName} className="grid grid-cols-[auto_1fr] gap-x-6">
              <div className="text-sm font-medium text-gray-600 py-1">
                {label}:
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
        }

        // Render nested objects/arrays as collapsible sections
        return (
          <Disclosure key={fieldName} defaultOpen={depth === 0}>
            <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
              <ChevronIcon />
              {label} {getFieldSummary(fieldDef, value)}
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
      })}
    </div>
  )
}
