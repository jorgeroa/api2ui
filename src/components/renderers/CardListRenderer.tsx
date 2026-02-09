import { useState, useEffect, useMemo } from 'react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DetailModal } from '../detail/DetailModal'
import { DetailPanel } from '../detail/DetailPanel'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { getHeroImageField } from '../../utils/imageDetection'
import { useNavigation } from '../../contexts/NavigationContext'
import { getItemLabel } from '../../utils/itemLabel'
import { useConfigStore } from '../../store/configStore'
import { usePagination } from '../../hooks/usePagination'
import { PaginationControls } from '../pagination/PaginationControls'

/**
 * CardListRenderer displays arrays of objects as a responsive grid of cards.
 * Each card shows fields filtered by importance tier (primary + secondary only).
 * Click on a card to open the DetailModal.
 */
export function CardListRenderer({ data, schema, path, depth, importance }: RendererProps) {
  const [selectedItem, setSelectedItem] = useState<unknown | null>(null)
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)
  const nav = useNavigation()
  const { getPaginationConfig, setPaginationConfig } = useConfigStore()

  // Listen for cross-navigation events from ConfigPanel
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

  // Pagination state
  const paginationConfig = getPaginationConfig(path, 12)
  const pagination = usePagination({
    totalItems: data.length,
    itemsPerPage: paginationConfig.itemsPerPage,
    currentPage: paginationConfig.currentPage,
  })

  const paginatedData = data.slice(pagination.firstIndex, pagination.lastIndex)

  const handlePageChange = (page: number) => {
    setPaginationConfig(path, { currentPage: page })
  }

  const handleItemsPerPageChange = (items: number) => {
    setPaginationConfig(path, { itemsPerPage: items, currentPage: 1 })
  }

  const fields = Array.from(schema.items.fields.entries())

  // Filter fields by importance tier (primary + secondary only)
  const fieldsToDisplay = useMemo(() => {
    if (!importance) {
      // No importance data - show all fields (v1.2 behavior preserved)
      return fields
    }

    const filtered = fields.filter(([fieldName]) => {
      const fieldPath = `${path}[].${fieldName}`
      const score = importance.get(fieldPath)
      // Show primary and secondary, hide tertiary
      return !score || score.tier === 'primary' || score.tier === 'secondary'
    })

    // Safety fallback: if tier filtering removes all fields, show all fields
    // This prevents empty cards when all fields score as tertiary
    return filtered.length > 0 ? filtered : fields
  }, [fields, importance, path])

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedData.map((item, paginatedIndex) => {
          const obj = item as Record<string, unknown>
          const globalIndex = pagination.firstIndex + paginatedIndex
          const title = getItemLabel(item)

          // Detect hero image from first image-URL field (use all fields for detection)
          const heroImage = getHeroImageField(obj, fields)

          // Show filtered fields (primary + secondary tier only), limited to first 5
          const displayFields = fieldsToDisplay.slice(0, 5)

          return (
            <div
              key={globalIndex}
              onClick={() => {
                if (nav && nav.drilldownMode === 'page') {
                  nav.onDrillDown(item, schema.items, title, `${path}[${globalIndex}]`)
                } else {
                  setSelectedItem(item)
                }
              }}
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
                    const fieldPath = `${path}[${globalIndex}].${fieldName}`

                    const displayLabel = fieldName
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (char) => char.toUpperCase())

                    return (
                      <div
                        key={fieldName}
                        className="text-sm"
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
                  {fieldsToDisplay.length > 5 && (
                    <div className="text-xs text-gray-400 italic">
                      +{fieldsToDisplay.length - 5} more fields
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination controls */}
      {(pagination.totalPages > 1 || data.length > 12) && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={data.length}
          itemsPerPage={paginationConfig.itemsPerPage}
          pageNumbers={pagination.pageNumbers}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Detail modal - dialog mode */}
      {(!nav || nav.drilldownMode === 'dialog') && (
        <DetailModal
          item={selectedItem}
          schema={schema.items}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Detail panel - panel mode */}
      {nav && nav.drilldownMode === 'panel' && (
        <DetailPanel
          item={selectedItem}
          schema={schema.items}
          onClose={() => setSelectedItem(null)}
        />
      )}

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
