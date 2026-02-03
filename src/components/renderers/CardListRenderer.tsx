import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'
import { isImageUrl } from '../../utils/imageDetection'
import type { FieldDefinition } from '../../types/schema'

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

/** Get the first image URL field from an item for hero image display */
function getHeroImageField(
  item: Record<string, unknown>,
  fields: Array<[string, FieldDefinition]>
): { fieldName: string; url: string } | null {
  for (const [fieldName, fieldDef] of fields) {
    if (fieldDef.type.kind === 'primitive') {
      const value = item[fieldName]
      if (typeof value === 'string' && isImageUrl(value)) {
        return { fieldName, url: value }
      }
    }
  }
  return null
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

          // Detect hero image from first image-URL field
          const heroImage = getHeroImageField(obj, fields)

          // Show first 4-5 fields
          const displayFields = fields.slice(0, 5)

          return (
            <div
              key={index}
              onClick={() => setSelectedItem(item)}
              className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              {/* Hero image - full width at top of card */}
              {heroImage && (
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={heroImage.url}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Card content wrapper with padding */}
              <div className="p-4">
                {/* Card header with title */}
                <div className="font-semibold text-lg mb-3 text-text border-b border-border pb-2">
                  {title}
                </div>

                {/* Card content: key-value pairs */}
                <div className="space-y-2">
                  {displayFields.map(([fieldName, fieldDef]) => {
                    // Skip hero image field to avoid duplication
                    if (heroImage && fieldName === heroImage.fieldName) return null

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
