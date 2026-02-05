import { useState, useEffect } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'
import { DynamicRenderer } from '../DynamicRenderer'
import { useConfigStore } from '../../store/configStore'
import { FieldControls } from '../config/FieldControls'
import { FieldConfigPopover } from '../config/FieldConfigPopover'
import { SortableFieldList } from '../config/SortableFieldList'
import { DraggableField } from '../config/DraggableField'
import { isImageUrl, getHeroImageField } from '../../utils/imageDetection'
import { HorizontalCardScroller } from './HorizontalCardScroller'

/** Detect primary fields (name, title, label, heading, subject) for typography hierarchy */
function isPrimaryField(fieldName: string): boolean {
  const nameLower = fieldName.toLowerCase()
  const primaryExact = ['name', 'title', 'label', 'heading', 'subject']
  if (primaryExact.includes(nameLower)) return true

  const primarySuffixes = ['_name', '_title', '_label', '-name', '-title', '-label', 'Name', 'Title']
  return primarySuffixes.some(suffix => fieldName.endsWith(suffix))
}

/** Detect metadata fields (created, updated, timestamps) */
function isMetadataField(fieldName: string): boolean {
  return /created|updated|modified|timestamp|date/i.test(fieldName)
}

/** Chevron icon that rotates when disclosure is open */
function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4 transition-transform ui-open:rotate-180"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/** Get a summary label for a nested field */
function getFieldSummary(fieldDef: { type: { kind: string } }, value: unknown): string {
  if (fieldDef.type.kind === 'array') {
    const length = Array.isArray(value) ? value.length : 0
    return `(${length} items)`
  }
  return '(object)'
}

export function DetailRenderer({ data, schema, path, depth }: RendererProps) {
  const [popoverState, setPopoverState] = useState<{
    fieldPath: string
    fieldName: string
    fieldValue: unknown
    position: { x: number; y: number }
  } | null>(null)
  const { mode, fieldConfigs, reorderFields } = useConfigStore()

  // Listen for cross-navigation events from ConfigPanel
  useEffect(() => {
    const handler = (e: Event) => {
      const { fieldPath } = (e as CustomEvent).detail
      if (schema.kind === 'object') {
        const fields = Array.from(schema.fields.entries())
        const match = fields.find(([name]) => `${path}.${name}` === fieldPath)
        if (match) {
          const [fieldName] = match
          const obj = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {}
          const fieldValue = obj[fieldName]
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
  }, [schema, data, path])

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

  if (schema.kind !== 'object') {
    return <div className="text-red-500">DetailRenderer expects object schema</div>
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return <div className="text-red-500">DetailRenderer expects object data</div>
  }

  const obj = data as Record<string, unknown>
  const allFields = Array.from(schema.fields.entries())

  if (allFields.length === 0) {
    return <div className="text-gray-500 italic">Empty object</div>
  }

  // Apply field ordering: sort by order if set, maintain original order otherwise
  const sortedFields = [...allFields].sort((a, b) => {
    const pathA = `${path}.${a[0]}`
    const pathB = `${path}.${b[0]}`
    const configA = fieldConfigs[pathA]
    const configB = fieldConfigs[pathB]

    const orderA = configA?.order ?? Number.MAX_SAFE_INTEGER
    const orderB = configB?.order ?? Number.MAX_SAFE_INTEGER

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // Preserve original order for fields with same/no order
    return allFields.findIndex(f => f[0] === a[0]) - allFields.findIndex(f => f[0] === b[0])
  })

  // Filter fields based on visibility in View mode
  const isConfigureMode = mode === 'configure'
  const visibleFields = isConfigureMode
    ? sortedFields  // Show all in Configure mode
    : sortedFields.filter(([fieldName]) => {
        const fieldPath = `${path}.${fieldName}`
        const config = fieldConfigs[fieldPath]
        return config?.visible !== false
      })

  if (visibleFields.length === 0 && !isConfigureMode) {
    return <div className="text-gray-500 italic">All fields hidden</div>
  }

  // Detect hero image for view mode
  const heroImage = !isConfigureMode ? getHeroImageField(obj, allFields) : null

  // Group fields for structured layout in view mode
  const primaryFields: Array<[string, FieldDefinition]> = []
  const regularFields: Array<[string, FieldDefinition]> = []
  const imageFields: Array<[string, FieldDefinition]> = []
  const metaFields: Array<[string, FieldDefinition]> = []
  const nestedFields: Array<[string, FieldDefinition]> = []

  if (!isConfigureMode) {
    for (const field of visibleFields) {
      const [fieldName, fieldDef] = field

      // Skip hero image field to avoid duplication
      if (heroImage && fieldName === heroImage.fieldName) continue

      if (fieldDef.type.kind === 'primitive') {
        const value = obj[fieldName]
        const isImage = typeof value === 'string' && isImageUrl(value)

        if (isPrimaryField(fieldName)) {
          primaryFields.push(field)
        } else if (isMetadataField(fieldName)) {
          metaFields.push(field)
        } else if (isImage) {
          imageFields.push(field)
        } else {
          regularFields.push(field)
        }
      } else {
        nestedFields.push(field)
      }
    }
  }

  // Field paths for drag-and-drop ordering
  const fieldPaths = visibleFields.map(([fieldName]) => `${path}.${fieldName}`)

  const handleReorder = (orderedPaths: string[]) => {
    reorderFields(orderedPaths)
  }

  // Helper to render a primitive field
  const renderPrimitiveField = (fieldName: string, fieldDef: FieldDefinition, value: unknown) => {
    const fieldPath = `${path}.${fieldName}`
    const config = fieldConfigs[fieldPath]
    const defaultLabel = fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const displayLabel = config?.label || defaultLabel
    const primary = isPrimaryField(fieldName)

    const contextMenuHandlers = {
      onContextMenu: (e: React.MouseEvent) => handleFieldContextMenu(e, fieldPath, fieldName, value),
      onTouchStart: (e: React.TouchEvent) => {
        const touch = e.touches[0]
        if (!touch) return
        const touchX = touch.clientX
        const touchY = touch.clientY
        const timer = setTimeout(() => {
          setPopoverState({ fieldPath, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
        }, 800)
        ;(e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer)
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
        if (timer) clearTimeout(Number(timer))
      },
      onTouchMove: (e: React.TouchEvent) => {
        const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
        if (timer) clearTimeout(Number(timer))
      },
    }

    return (
      <div key={fieldName} className="grid grid-cols-[auto_1fr] gap-x-6" {...contextMenuHandlers}>
        <div className={primary
          ? "text-base font-semibold text-gray-700 py-1"
          : "text-sm font-medium text-gray-600 py-1"
        }>
          {displayLabel}:
        </div>
        <div className={primary
          ? "py-1 text-lg font-semibold text-gray-900"
          : "py-1"
        }>
          <PrimitiveRenderer
            data={value}
            schema={fieldDef.type}
            path={fieldPath}
            depth={depth + 1}
          />
        </div>
      </div>
    )
  }

  // Helper to render an image field
  const renderImageField = (fieldName: string, fieldDef: FieldDefinition, value: unknown) => {
    const fieldPath = `${path}.${fieldName}`
    const config = fieldConfigs[fieldPath]
    const defaultLabel = fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const displayLabel = config?.label || defaultLabel

    return (
      <div
        key={fieldName}
        className="space-y-2"
        onContextMenu={(e) => handleFieldContextMenu(e, fieldPath, fieldName, value)}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          if (!touch) return
          const touchX = touch.clientX
          const touchY = touch.clientY
          const timer = setTimeout(() => {
            setPopoverState({ fieldPath, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
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
        <div className="text-sm font-medium text-gray-600">
          {displayLabel}
        </div>
        <img
          src={value as string}
          alt={displayLabel}
          loading="lazy"
          className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-gray-50"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
    )
  }

  // Helper to render nested fields
  const renderNestedField = (fieldName: string, fieldDef: FieldDefinition, value: unknown) => {
    const fieldPath = `${path}.${fieldName}`
    const config = fieldConfigs[fieldPath]
    const defaultLabel = fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
    const displayLabel = config?.label || defaultLabel

    // In view mode, use HorizontalCardScroller for arrays of objects
    if (
      !isConfigureMode &&
      fieldDef.type.kind === 'array' &&
      fieldDef.type.items.kind === 'object' &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      return (
        <div key={fieldName}>
          <HorizontalCardScroller
            items={value as unknown[]}
            schema={fieldDef.type.items}
            path={fieldPath}
            depth={depth + 1}
            label={displayLabel}
          />
        </div>
      )
    }

    // Default nested rendering (objects, arrays of primitives, empty arrays, configure mode)
    return (
      <div key={fieldName}>
        <Disclosure defaultOpen={depth === 0}>
          <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <ChevronIcon />
            {displayLabel} {getFieldSummary(fieldDef, value)}
          </DisclosureButton>
          <DisclosurePanel className="ml-4 mt-2 border-l-2 border-border pl-4">
            <DynamicRenderer
              data={value}
              schema={fieldDef.type}
              path={fieldPath}
              depth={depth + 1}
            />
          </DisclosurePanel>
        </Disclosure>
      </div>
    )
  }

  const renderFields = () => {
    return visibleFields.map(([fieldName, fieldDef]) => {
      const value = obj[fieldName]
      const fieldPath = `${path}.${fieldName}`
      const config = fieldConfigs[fieldPath]
      const isVisible = config?.visible !== false

      // Format label: use custom label if set, otherwise auto-format
      const defaultLabel = fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
      const displayLabel = config?.label || defaultLabel

      // Render primitive fields inline
      if (fieldDef.type.kind === 'primitive') {
        // Check if this is an image URL — render full-width
        const isImage = typeof value === 'string' && isImageUrl(value)

        if (isImage) {
          const imageContent = (
            <div
              className="space-y-2"
              onContextMenu={(e) => handleFieldContextMenu(e, fieldPath, fieldName, value)}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                if (!touch) return
                const touchX = touch.clientX
                const touchY = touch.clientY
                const timer = setTimeout(() => {
                  setPopoverState({ fieldPath, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
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
              <div className="text-sm font-medium text-gray-600">
                {displayLabel}
              </div>
              <img
                src={value as string}
                alt={displayLabel}
                loading="lazy"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-gray-50"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )

          // Wrap with FieldControls/DraggableField in Configure mode (same pattern as existing)
          if (isConfigureMode) {
            return (
              <DraggableField key={fieldName} id={fieldPath}>
                <FieldControls
                  fieldPath={fieldPath}
                  fieldName={fieldName}
                  isVisible={isVisible}
                  customLabel={config?.label}
                >
                  {imageContent}
                </FieldControls>
              </DraggableField>
            )
          }
          return <div key={fieldName}>{imageContent}</div>
        }

        const primary = isPrimaryField(fieldName)

        const contextMenuHandlers = {
          onContextMenu: (e: React.MouseEvent) => handleFieldContextMenu(e, fieldPath, fieldName, value),
          onTouchStart: (e: React.TouchEvent) => {
            const touch = e.touches[0]
            if (!touch) return
            const touchX = touch.clientX
            const touchY = touch.clientY
            const timer = setTimeout(() => {
              setPopoverState({ fieldPath, fieldName, fieldValue: value, position: { x: touchX, y: touchY } })
            }, 800)
            ;(e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer)
          },
          onTouchEnd: (e: React.TouchEvent) => {
            const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
            if (timer) clearTimeout(Number(timer))
          },
          onTouchMove: (e: React.TouchEvent) => {
            const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
            if (timer) clearTimeout(Number(timer))
          },
        }

        const fieldContent = (
          <div className="grid grid-cols-[auto_1fr] gap-x-6" {...contextMenuHandlers}>
            <div className={primary
              ? "text-base font-semibold text-gray-700 py-1"
              : "text-sm font-medium text-gray-600 py-1"
            }>
              {displayLabel}:
            </div>
            <div className={primary
              ? "py-1 text-lg font-semibold text-gray-900"
              : "py-1"
            }>
              <PrimitiveRenderer
                data={value}
                schema={fieldDef.type}
                path={fieldPath}
                depth={depth + 1}
              />
            </div>
          </div>
        )

        // In Configure mode: wrap with FieldControls and DraggableField
        const wrappedField = isConfigureMode ? (
          <FieldControls
            key={fieldName}
            fieldPath={fieldPath}
            fieldName={fieldName}
            isVisible={isVisible}
            customLabel={config?.label}
          >
            {fieldContent}
          </FieldControls>
        ) : (
          <div key={fieldName}>{fieldContent}</div>
        )

        if (isConfigureMode) {
          return (
            <DraggableField key={fieldName} id={fieldPath}>
              {wrappedField}
            </DraggableField>
          )
        }

        return wrappedField
      }

      // Render nested objects/arrays as collapsible sections
      const nestedContent = (
        <Disclosure defaultOpen={depth === 0}>
          <DisclosureButton className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <ChevronIcon />
            {displayLabel} {getFieldSummary(fieldDef, value)}
          </DisclosureButton>
          <DisclosurePanel className="ml-4 mt-2 border-l-2 border-border pl-4">
            <DynamicRenderer
              data={value}
              schema={fieldDef.type}
              path={fieldPath}
              depth={depth + 1}
            />
          </DisclosurePanel>
        </Disclosure>
      )

      // In Configure mode: wrap with FieldControls and DraggableField
      const wrappedNestedField = isConfigureMode ? (
        <FieldControls
          key={fieldName}
          fieldPath={fieldPath}
          fieldName={fieldName}
          isVisible={isVisible}
          customLabel={config?.label}
        >
          {nestedContent}
        </FieldControls>
      ) : (
        <div key={fieldName}>{nestedContent}</div>
      )

      if (isConfigureMode) {
        return (
          <DraggableField key={fieldName} id={fieldPath}>
            {wrappedNestedField}
          </DraggableField>
        )
      }

      return wrappedNestedField
    })
  }

  const fieldsContent = renderFields()

  const popoverElement = popoverState && (
    <FieldConfigPopover
      fieldPath={popoverState.fieldPath}
      fieldName={popoverState.fieldName}
      fieldValue={popoverState.fieldValue}
      position={popoverState.position}
      onClose={() => setPopoverState(null)}
    />
  )

  // In Configure mode: wrap with SortableFieldList
  if (isConfigureMode) {
    return (
      <div className="space-y-3 border border-border rounded-lg p-4">
        <SortableFieldList items={fieldPaths} onReorder={handleReorder}>
          {fieldsContent}
        </SortableFieldList>
        {popoverElement}
      </div>
    )
  }

  // View mode: enhanced two-column layout with hero image and field grouping
  return (
    <div className="space-y-6 border border-border rounded-lg p-4">
      {heroImage && (
        <div className="w-full">
          <img
            src={heroImage.url}
            alt="Detail hero"
            loading="lazy"
            className="w-full max-h-96 object-cover rounded-lg border border-gray-200"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {primaryFields.map(([fieldName, fieldDef]) =>
          renderPrimitiveField(fieldName, fieldDef, obj[fieldName])
        )}
        {primaryFields.length > 0 && (
          <div className="md:col-span-2 border-b border-gray-200" />
        )}
        {regularFields.map(([fieldName, fieldDef]) =>
          renderPrimitiveField(fieldName, fieldDef, obj[fieldName])
        )}
        {imageFields.map(([fieldName, fieldDef]) => (
          <div key={fieldName} className="md:col-span-2">
            {renderImageField(fieldName, fieldDef, obj[fieldName])}
          </div>
        ))}
        {nestedFields.map(([fieldName, fieldDef]) => (
          <div key={fieldName} className="md:col-span-2">
            {renderNestedField(fieldName, fieldDef, obj[fieldName])}
          </div>
        ))}
        {metaFields.length > 0 && (
          <div className="md:col-span-2 border-t border-gray-200 pt-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {metaFields.map(([fieldName, fieldDef]) =>
                renderPrimitiveField(fieldName, fieldDef, obj[fieldName])
              )}
            </div>
          </div>
        )}
      </div>
      {popoverElement}
    </div>
  )
}
