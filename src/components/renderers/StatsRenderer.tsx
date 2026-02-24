import { useState, useEffect } from 'react'
import type { RendererProps } from '../../types/components'
import { DrilldownContainer } from '../detail/DrilldownContainer'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { useItemDrilldown } from '../../hooks/useItemDrilldown'
import { getItemLabel } from '../../utils/itemLabel'
import { formatLabel } from '../../utils/formatLabel'

/** Renders arrays of objects as KPI/metric cards */
export function StatsRenderer({ data, schema, path }: RendererProps) {
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)
  const { selectedItem, handleItemClick, clearSelection } = useItemDrilldown(
    schema.kind === 'array' ? schema.items : schema, path, data, schema
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const { fieldPath } = (e as CustomEvent).detail
      if (schema.kind === 'array' && schema.items.kind === 'object') {
        const columns = Array.from(schema.items.fields.entries())
        const match = columns.find(([name]) => `${path}[].${name}` === fieldPath)
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
    return <div className="text-red-500">StatsRenderer expects array of objects</div>
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-muted-foreground italic p-4">No data</div>
  }

  const fields = Array.from(schema.items.fields.entries())

  // Find the first number field for the big metric value
  const metricField = fields.find(([, def]) =>
    def.type.kind === 'primitive' && def.type.type === 'number'
  )

  // Find a secondary field for extra context
  const secondaryField = fields.find(([name, def]) =>
    def.type.kind === 'primitive' &&
    name !== metricField?.[0] &&
    def.type.type !== 'number'
  )

  const handleClick = (item: unknown, index: number) => {
    handleItemClick(item, index, getItemLabel(item))
  }

  return (
    <div>
      <div className="grid grid-cols-2 @lg:grid-cols-3 @5xl:grid-cols-4 gap-4">
        {data.map((item, index) => {
          const obj = item as Record<string, unknown>
          const label = getItemLabel(item)
          const metricValue = metricField ? obj[metricField[0]] : null
          const secondaryValue = secondaryField ? obj[secondaryField[0]] : null

          return (
            <div
              key={index}
              onClick={() => handleClick(item, index)}
              className="border border-border rounded-lg p-6 text-center hover:shadow-md hover:border-foreground/20 hover:-translate-y-0.5 cursor-pointer transition-all duration-150"
            >
              <div className="text-3xl font-bold text-foreground">
                {typeof metricValue === 'number'
                  ? metricValue.toLocaleString()
                  : metricValue != null
                    ? String(metricValue)
                    : '--'}
              </div>
              <div className="text-sm text-muted-foreground mt-2 truncate" title={label}>
                {label}
              </div>
              {secondaryValue != null && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {metricField && <span className="text-muted-foreground">{formatLabel(metricField[0])}: </span>}
                  {secondaryField && (
                    <span>{formatLabel(secondaryField[0])}: {String(secondaryValue)}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DrilldownContainer
        selectedItem={selectedItem}
        itemSchema={schema.items}
        onClose={clearSelection}
      />

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
