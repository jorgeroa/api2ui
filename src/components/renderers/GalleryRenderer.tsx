import { useState, useEffect } from 'react'
import type { RendererProps } from '../../types/components'
import { DrilldownContainer } from '../detail/DrilldownContainer'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { getHeroImageField } from '../../utils/imageDetection'
import { useItemDrilldown } from '../../hooks/useItemDrilldown'
import { getItemLabel } from '../../utils/itemLabel'

/** Renders arrays of objects as an image-forward masonry gallery */
export function GalleryRenderer({ data, schema, path }: RendererProps) {
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
    return <div className="text-red-500">GalleryRenderer expects array of objects</div>
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-muted-foreground italic p-4">No data</div>
  }

  const fields = Array.from(schema.items.fields.entries())

  const handleClick = (item: unknown, index: number) => {
    handleItemClick(item, index, getItemLabel(item))
  }

  return (
    <div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {data.map((item, index) => {
          const obj = item as Record<string, unknown>
          const title = getItemLabel(item)
          const heroImage = getHeroImageField(obj, fields)

          return (
            <div
              key={index}
              onClick={() => handleClick(item, index)}
              className="break-inside-avoid rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md cursor-pointer transition-all"
            >
              {heroImage ? (
                <div className="relative">
                  <img
                    src={heroImage.url}
                    alt={title}
                    loading="lazy"
                    className="w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="text-white text-sm font-medium truncate">{title}</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-card">
                  <div className="font-medium text-foreground">{title}</div>
                  {fields.slice(0, 2).map(([fieldName]) => {
                    const val = obj[fieldName]
                    if (val === null || val === undefined) return null
                    return (
                      <div key={fieldName} className="text-xs text-muted-foreground mt-1 truncate">
                        {String(val)}
                      </div>
                    )
                  })}
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
