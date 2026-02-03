import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'
import { FieldConfigPopover } from '../config/FieldConfigPopover'

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
 * ListRenderer displays arrays of objects as a simple vertical list.
 * Each item shows the title + 2-3 key field values inline.
 * Click on an item to open the DetailModal.
 */
export function ListRenderer({ data, schema, path, depth }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null)
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)

  const handleFieldContextMenu = (
    e: React.MouseEvent,
    fieldPath: string,
    fieldName: string,
    fieldValue: unknown
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setPopoverState({ fieldPath, fieldName, fieldValue, position: { x: e.clientX, y: e.clientY } })
  }

  if (schema.kind !== 'array') {
    return <div className="text-red-500">ListRenderer expects array schema</div>
  }

  if (!Array.isArray(data)) {
    return <div className="text-red-500">ListRenderer expects array data</div>
  }

  // Handle empty arrays
  if (data.length === 0) {
    return <div className="text-gray-500 italic p-4">No data</div>
  }

  // Extract fields from the item schema (must be object)
  if (schema.items.kind !== 'object') {
    return <div className="text-red-500">ListRenderer expects array of objects</div>
  }

  const fields = Array.from(schema.items.fields.entries())

  return (
    <div>
      <div className="border border-border rounded-lg overflow-hidden">
        {data.map((item, index) => {
          const obj = item as Record<string, unknown>
          const title = getItemTitle(item)

          // Show first 2-3 non-title fields inline
          const titleField = ['name', 'title', 'label', 'id'].find((name) => {
            const value = obj[name]
            return typeof value === 'string' && value.length > 0
          })

          const displayFields = fields
            .filter(([fieldName]) => fieldName !== titleField)
            .slice(0, 3)

          return (
            <div
              key={index}
              onClick={() => setSelectedItem(item)}
              className="border-b border-border last:border-b-0 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-text">{title}</span>
                {displayFields.map(([fieldName, fieldDef]) => {
                  const value = obj[fieldName]
                  const fieldPath = `${path}[${index}].${fieldName}`

                  return (
                    <span
                      key={fieldName}
                      className="text-sm text-gray-600"
                      onContextMenu={(e) => handleFieldContextMenu(e, `$[].${fieldName}`, fieldName, value)}
                      onTouchStart={(e) => {
                        const touch = e.touches[0]
                        if (!touch) return
                        const touchX = touch.clientX
                        const touchY = touch.clientY
                        const timer = setTimeout(() => {
                          setPopoverState({ fieldPath: `$[].${fieldName}`, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
                        }, 800)
                        ;(e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer)
                      }}
                      onTouchEnd={(e) => {
                        const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
                        if (timer) clearTimeout(Number(timer))
                      }}
                      onTouchMove={(e) => {
                        const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
                        if (timer) clearTimeout(Number(timer))
                      }}
                    >
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
                    </span>
                  )
                })}
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

      {/* Field config popover */}
      {popoverState && (
        <FieldConfigPopover
          fieldPath={popoverState.fieldPath}
          fieldName={popoverState.fieldName}
          fieldValue={popoverState.fieldValue}
          position={popoverState.position}
          onClose={() => setPopoverState(null)}
        />
      )}
    </div>
  )
}
