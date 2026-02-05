import { useState, useEffect } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { useNavigation } from '../../contexts/NavigationContext'
import { getItemLabel } from '../../utils/itemLabel'
import { formatLabel } from '../../utils/formatLabel'

/** Find the best date field from schema fields */
function findDateField(fields: Array<[string, { type: { kind: string; type?: string } }]>): string | null {
  // Prefer fields with date type
  const dateTyped = fields.find(([, def]) =>
    def.type.kind === 'primitive' && def.type.type === 'date'
  )
  if (dateTyped) return dateTyped[0]

  // Fall back to field name heuristics
  const dateKeywords = ['created_at', 'createdAt', 'date', 'created', 'updated_at', 'updatedAt', 'updated', 'timestamp', 'time']
  for (const keyword of dateKeywords) {
    const match = fields.find(([name]) => name.toLowerCase() === keyword.toLowerCase())
    if (match) return match[0]
  }

  // Broader match
  const broad = fields.find(([name]) => /date|time|created|updated/i.test(name))
  return broad ? broad[0] : null
}

/** Renders arrays of objects as a vertical timeline */
export function TimelineRenderer({ data, schema, path, depth }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null)
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)
  const nav = useNavigation()

  useEffect(() => {
    const handler = (e: Event) => {
      const { fieldPath } = (e as CustomEvent).detail
      if (schema.kind === 'array' && schema.items.kind === 'object') {
        const columns = Array.from(schema.items.fields.entries())
        const match = columns.find(([name]) => `$[].${name}` === fieldPath)
        if (match) {
          const [fieldName] = match
          const firstRow = Array.isArray(data) && data.length > 0 ? data[0] as Record<string, unknown> : null
          const fieldValue = firstRow ? firstRow[fieldName] : undefined
          const el = document.querySelector(`[data-field-path="${fieldPath}"]`)
          const rect = el?.getBoundingClientRect()
          const pos = rect
            ? { x: rect.right, y: rect.top }
            : { x: window.innerWidth / 2, y: window.innerHeight / 3 }
          setPopoverState({ fieldPath, fieldName, fieldValue, position: pos })
        }
      }
    }
    document.addEventListener('api2ui:configure-field', handler)
    return () => document.removeEventListener('api2ui:configure-field', handler)
  }, [schema, data])

  if (schema.kind !== 'array' || schema.items.kind !== 'object') {
    return <div className="text-red-500">TimelineRenderer expects array of objects</div>
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 italic p-4">No data</div>
  }

  const fields = Array.from(schema.items.fields.entries())
  const dateFieldName = findDateField(fields)

  const handleClick = (item: unknown, index: number) => {
    const title = getItemLabel(item)
    if (nav && nav.drilldownMode === 'page') {
      nav.onDrillDown(item, schema.items, title, `${path}[${index}]`)
    } else {
      setSelectedItem(item)
    }
  }

  // Fields to show in the content card (exclude date and title-like fields)
  const contentFields = fields.filter(([name, def]) => {
    if (name === dateFieldName) return false
    if (def.type.kind !== 'primitive') return false
    return true
  }).slice(0, 3)

  return (
    <div>
      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {data.map((item, index) => {
            const obj = item as Record<string, unknown>
            const title = getItemLabel(item)
            const dateValue = dateFieldName ? obj[dateFieldName] : null

            let dateDisplay = `#${index + 1}`
            if (dateValue && typeof dateValue === 'string') {
              try {
                const date = new Date(dateValue)
                if (!isNaN(date.getTime())) {
                  dateDisplay = date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
              } catch {
                dateDisplay = String(dateValue)
              }
            }

            return (
              <div
                key={index}
                onClick={() => handleClick(item, index)}
                className="flex items-start cursor-pointer group"
              >
                {/* Dot on the timeline */}
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow shrink-0 mt-1.5 relative z-10 -ml-[5px]" />

                {/* Content card */}
                <div className="ml-4 flex-1 border border-border rounded-lg p-3 group-hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-text">{title}</div>
                    <div className="text-xs text-gray-500 shrink-0 ml-2">{dateDisplay}</div>
                  </div>
                  {contentFields.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {contentFields.map(([fieldName, fieldDef]) => {
                        const value = obj[fieldName]
                        if (value === null || value === undefined) return null
                        return (
                          <div key={fieldName} className="text-sm flex gap-2">
                            <span className="text-gray-500 shrink-0">{formatLabel(fieldName)}:</span>
                            <PrimitiveRenderer
                              data={value}
                              schema={fieldDef.type}
                              path={`${path}[${index}].${fieldName}`}
                              depth={depth + 1}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(!nav || nav.drilldownMode === 'dialog') && (
        <DetailModal
          item={selectedItem}
          schema={schema.items}
          onClose={() => setSelectedItem(null)}
        />
      )}

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
