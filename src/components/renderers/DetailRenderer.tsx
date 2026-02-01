import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'

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
    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border border-gray-200 rounded-lg p-4">
      {fields.map(([fieldName, fieldDef]) => {
        const value = obj[fieldName]
        const fieldPath = `${path}.${fieldName}`

        // Format label: capitalize first letter, replace underscores with spaces
        const label = fieldName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())

        return (
          <div key={fieldName} className="contents">
            <div className="text-sm font-medium text-gray-600 py-1">
              {label}:
            </div>
            <div className="py-1">
              {fieldDef.type.kind === 'primitive' ? (
                <PrimitiveRenderer
                  data={value}
                  schema={fieldDef.type}
                  path={fieldPath}
                  depth={depth + 1}
                />
              ) : (
                <DynamicRenderer
                  data={value}
                  schema={fieldDef.type}
                  path={fieldPath}
                  depth={depth + 1}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
