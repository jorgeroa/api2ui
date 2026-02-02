import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'

/** Get a title from an item by checking common name fields */
function getItemTitle(item: unknown): string {
  if (typeof item !== 'object' || item === null) {
    return 'Item'
  }

  const obj = item as Record<string, unknown>
  const nameFields = ['name', 'title', 'label', 'id']

  for (const field of nameFields) {
    const value = obj[field]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return 'Item'
}

/**
 * CardListRenderer displays arrays of objects as a responsive grid of cards.
 * Each card shows the first 4-5 fields as key-value pairs.
 * Click on a card to open the DetailModal.
 */
export function CardListRenderer({ data, schema, path, depth }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null)

  if (schema.kind !== 'array') {
    return <div className="text-red-500">CardListRenderer expects array schema</div>
  }

  if (!Array.isArray(data)) {
    return <div className="text-red-500">CardListRenderer expects array data</div>
  }

  // Handle empty arrays
  if (data.length === 0) {
    return <div className="text-gray-500 italic p-4">No data</div>
  }

  // Extract fields from the item schema (must be object)
  if (schema.items.kind !== 'object') {
    return <div className="text-red-500">CardListRenderer expects array of objects</div>
  }

  const fields = Array.from(schema.items.fields.entries())

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, index) => {
          const obj = item as Record<string, unknown>
          const title = getItemTitle(item)

          // Show first 4-5 fields
          const displayFields = fields.slice(0, 5)

          return (
            <div
              key={index}
              onClick={() => setSelectedItem(item)}
              className="border border-border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              {/* Card header with title */}
              <div className="font-semibold text-lg mb-3 text-text border-b border-border pb-2">
                {title}
              </div>

              {/* Card content: key-value pairs */}
              <div className="space-y-2">
                {displayFields.map(([fieldName, fieldDef]) => {
                  const value = obj[fieldName]
                  const fieldPath = `${path}[${index}].${fieldName}`

                  const displayLabel = fieldName
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase())

                  return (
                    <div key={fieldName} className="text-sm">
                      <span className="text-gray-600 font-medium">
                        {displayLabel}:{' '}
                      </span>
                      {fieldDef.type.kind === 'primitive' ? (
                        <PrimitiveRenderer
                          data={value}
                          schema={fieldDef.type}
                          path={fieldPath}
                          depth={depth + 1}
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {Array.isArray(value)
                            ? `[${value.length} items]`
                            : typeof value === 'object'
                            ? '{object}'
                            : String(value)}
                        </span>
                      )}
                    </div>
                  )
                })}
                {fields.length > 5 && (
                  <div className="text-xs text-gray-400 italic">
                    +{fields.length - 5} more fields
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      <DetailModal
        item={selectedItem}
        schema={schema.items}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}
