import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { formatLabel } from '../../utils/formatLabel'

const primaryKeywords = /name|title|description|summary|content|body|bio|about|text|message/i

/** Renders a single object in a two-column layout: primary content left, metadata right */
export function SplitRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'object') {
    return <div className="text-red-500">SplitRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">SplitRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const allFields = Array.from(schema.fields.entries())

  if (allFields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  const primitiveFields = allFields.filter(([, def]) => def.type.kind === 'primitive')
  const nestedFields = allFields.filter(([, def]) => def.type.kind !== 'primitive')

  const primaryFields = primitiveFields.filter(([name]) => primaryKeywords.test(name))
  const metadataFields = primitiveFields.filter(([name]) => !primaryKeywords.test(name))

  // If no primary fields detected, split evenly
  const leftFields = primaryFields.length > 0 ? primaryFields : primitiveFields.slice(0, Math.ceil(primitiveFields.length / 2))
  const rightFields = primaryFields.length > 0 ? metadataFields : primitiveFields.slice(Math.ceil(primitiveFields.length / 2))

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
        {/* Left: Primary/content fields */}
        <div className="p-4 space-y-3">
          {leftFields.map(([name, def]) => (
            <div key={name}>
              <div className="text-xs text-gray-500 font-medium mb-1">{formatLabel(name)}</div>
              <div className="text-sm">
                <PrimitiveRenderer
                  data={obj[name]}
                  schema={def.type}
                  path={`${path}.${name}`}
                  depth={depth + 1}
                />
              </div>
            </div>
          ))}
          {leftFields.length === 0 && (
            <div className="text-gray-500 italic text-sm">No primary fields</div>
          )}
        </div>

        {/* Right: Metadata fields */}
        {rightFields.length > 0 && (
          <div className="p-4 bg-gray-50 border-l border-border space-y-3">
            {rightFields.map(([name, def]) => (
              <div key={name} className="text-sm">
                <span className="text-gray-500 font-medium">{formatLabel(name)}: </span>
                <PrimitiveRenderer
                  data={obj[name]}
                  schema={def.type}
                  path={`${path}.${name}`}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-width nested sections */}
      {nestedFields.map(([name, def]) => (
        <div key={name} className="border-t border-border p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{formatLabel(name)}</h3>
          <DynamicRenderer
            data={obj[name]}
            schema={def.type}
            path={`${path}.${name}`}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  )
}
