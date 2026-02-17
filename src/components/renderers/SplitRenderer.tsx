import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { formatLabel } from '../../utils/formatLabel'

const primaryKeywords = /name|title|description|summary|content|body|bio|about|text|message/i

/** Check if a value is empty (null, undefined, or empty string) */
function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/** Renders a single object in a two-column layout: primary content left, metadata right */
export function SplitRenderer({ data, schema, path, depth }: RendererProps) {
  const [showNullFields, setShowNullFields] = useState(false)

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

  const allPrimitiveFields = allFields.filter(([, def]) => def.type.kind === 'primitive')
  const nestedFields = allFields.filter(([, def]) => def.type.kind !== 'primitive')

  // Count empty primitive fields
  const nullFieldCount = allPrimitiveFields.filter(([name]) => isEmptyValue(obj[name])).length

  // Filter primitives based on showNullFields toggle
  const primitiveFields = showNullFields
    ? allPrimitiveFields
    : allPrimitiveFields.filter(([name]) => !isEmptyValue(obj[name]))

  const primaryFields = primitiveFields.filter(([name]) => primaryKeywords.test(name))
  const metadataFields = primitiveFields.filter(([name]) => !primaryKeywords.test(name))

  // If no primary fields detected, split evenly
  const leftFields = primaryFields.length > 0 ? primaryFields : primitiveFields.slice(0, Math.ceil(primitiveFields.length / 2))
  const rightFields = primaryFields.length > 0 ? metadataFields : primitiveFields.slice(Math.ceil(primitiveFields.length / 2))

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Empty fields toggle — only shown when there are empty fields */}
      {nullFieldCount > 0 && (
        <div className="flex justify-end px-4 pt-2">
          <button
            onClick={() => setShowNullFields(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title={showNullFields ? "Hide empty fields" : `Show ${nullFieldCount} empty field${nullFieldCount === 1 ? '' : 's'}`}
          >
            {showNullFields ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            <span>{showNullFields ? 'Hide empty' : `Show ${nullFieldCount} empty`}</span>
          </button>
        </div>
      )}
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
