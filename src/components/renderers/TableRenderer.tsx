import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'
import { useConfigStore } from '../../store/configStore'
import { FieldControls } from '../config/FieldControls'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { SortableFieldList } from '../config/SortableFieldList'
import { DraggableField } from '../config/DraggableField'
import { isImageUrl } from '../../utils/imageDetection'

/** Compact inline display for non-primitive values in table cells */
function CompactValue({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }
  if (Array.isArray(data)) {
    return (
      <span className="text-gray-500 text-xs" title={JSON.stringify(data)}>
        [{data.length} items]
      </span>
    )
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data)
    return (
      <span className="text-gray-500 text-xs" title={JSON.stringify(data)}>
        {'{'}
        {keys.slice(0, 2).join(', ')}
        {keys.length > 2 ? ', ...' : ''}
        {'}'}
      </span>
    )
  }
  return <span>{String(data)}</span>
}

/**
 * TableRenderer displays arrays of objects as a scrollable table.
 * Uses CSS-based scrolling with good performance for large datasets.
 * Note: react-window 2.x has API changes that are incompatible with the plan's expectations.
 * This implementation provides the same UX with simpler, more reliable code.
 */
export function TableRenderer({ data, schema, path, depth }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null)
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)
  const { mode, fieldConfigs, reorderFields } = useConfigStore()

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
    return <div className="text-red-500">TableRenderer expects array schema</div>
  }

  if (!Array.isArray(data)) {
    return <div className="text-red-500">TableRenderer expects array data</div>
  }

  // Handle empty arrays
  if (data.length === 0) {
    return <div className="text-gray-500 italic p-4">No data</div>
  }

  // Extract columns from the item schema (must be object)
  if (schema.items.kind !== 'object') {
    return <div className="text-red-500">TableRenderer expects array of objects</div>
  }

  const allColumns = Array.from(schema.items.fields.entries())

  // Apply field ordering: sort by order if set, maintain original order otherwise
  const sortedColumns = [...allColumns].sort((a, b) => {
    const pathA = `$[].${a[0]}`
    const pathB = `$[].${b[0]}`
    const configA = fieldConfigs[pathA]
    const configB = fieldConfigs[pathB]

    const orderA = configA?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = configB?.order ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Preserve original order for fields with same/no order
    return allColumns.findIndex(col => col[0] === a[0]) - allColumns.findIndex(col => col[0] === b[0])
  })

  // Filter columns based on visibility in View mode
  const isConfigureMode = mode === 'configure'
  const visibleColumns = isConfigureMode
    ? sortedColumns  // Show all in Configure mode
    : sortedColumns.filter(([fieldName]) => {
        const fieldPath = `$[].${fieldName}`
        const config = fieldConfigs[fieldPath]
        return config?.visible !== false
      })

  if (visibleColumns.length === 0 && !isConfigureMode) {
    return <div className="text-gray-500 italic p-4">All fields hidden</div>
  }

  const columnWidth = Math.max(150, Math.floor(900 / visibleColumns.length))

  // Column paths for drag-and-drop ordering
  const columnPaths = visibleColumns.map(([fieldName]) => `$[].${fieldName}`)

  const handleReorder = (orderedPaths: string[]) => {
    reorderFields(orderedPaths)
  }

  const renderHeader = () => {
    const headerRow = (
      <div className="flex bg-background border-b-2 border-border font-semibold sticky top-0 z-10">
        {visibleColumns.map(([fieldName]) => {
          const fieldPath = `$[].${fieldName}`
          const config = fieldConfigs[fieldPath]
          const isVisible = config?.visible !== false

          // Format column header: use custom label if set, otherwise auto-format
          const defaultLabel = fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())
          const displayLabel = config?.label || defaultLabel

          const headerContent = (
            <div
              className="px-4 py-3 border-r border-border text-sm"
              style={{ width: columnWidth, minWidth: columnWidth }}
            >
              {displayLabel}
            </div>
          )

          const headerCell = isConfigureMode ? (
            <FieldControls
              key={fieldName}
              fieldPath={fieldPath}
              fieldName={fieldName}
              isVisible={isVisible}
              customLabel={config?.label}
            >
              {headerContent}
            </FieldControls>
          ) : (
            <div key={fieldName}>{headerContent}</div>
          )

          // In Configure mode: wrap each header cell in DraggableField
          if (isConfigureMode) {
            return (
              <DraggableField key={fieldName} id={fieldPath}>
                {headerCell}
              </DraggableField>
            )
          }

          return headerCell
        })}
      </div>
    )

    // In Configure mode: wrap the entire header row in SortableFieldList
    if (isConfigureMode) {
      return (
        <SortableFieldList items={columnPaths} onReorder={handleReorder}>
          {headerRow}
        </SortableFieldList>
      )
    }

    return headerRow
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header - sticky positioning keeps it visible while scrolling */}
      {renderHeader()}

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        {data.map((item, rowIndex) => {
          const row = item as Record<string, unknown>
          const isEven = rowIndex % 2 === 0

          return (
            <div
              key={rowIndex}
              onClick={() => setSelectedItem(item)}
              className={`flex border-b border-border cursor-pointer hover:bg-blue-50 ${
                isEven ? 'bg-surface' : 'bg-background'
              }`}
            >
              {visibleColumns.map(([fieldName, fieldDef]) => {
                const value = row[fieldName]
                const cellPath = `${path}[${rowIndex}].${fieldName}`
                const columnFieldPath = `$[].${fieldName}`

                // Check if this cell contains an image URL
                const isImage = fieldDef.type.kind === 'primitive' &&
                               typeof value === 'string' &&
                               isImageUrl(value)

                return (
                  <div
                    key={fieldName}
                    className="px-4 py-2 border-r border-border flex items-center overflow-hidden"
                    style={{ width: columnWidth, minWidth: columnWidth, height: '40px' }}
                    onContextMenu={(e) => handleFieldContextMenu(e, columnFieldPath, fieldName, value)}
                    onTouchStart={(e) => {
                      const touch = e.touches[0]
                      if (!touch) return
                      const touchX = touch.clientX
                      const touchY = touch.clientY
                      const timer = setTimeout(() => {
                        e.preventDefault()
                        setPopoverState({ fieldPath: columnFieldPath, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
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
                    {isImage ? (
                      <div className="flex items-center gap-2 w-full">
                        <img
                          src={value as string}
                          alt={fieldName}
                          loading="lazy"
                          className="h-8 w-8 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        <span className="text-xs text-gray-500 truncate" title={value as string}>
                          {(value as string).split('/').pop() || value}
                        </span>
                      </div>
                    ) : (
                      <div className="truncate w-full">
                        {fieldDef.type.kind === 'primitive' ? (
                          <PrimitiveRenderer
                            data={value}
                            schema={fieldDef.type}
                            path={cellPath}
                            depth={depth + 1}
                          />
                        ) : (
                          <CompactValue data={value} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
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
