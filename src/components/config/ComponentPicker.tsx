import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { TypeSignature } from '../../types/schema'
import { TableRenderer } from '../renderers/TableRenderer'
import { CardListRenderer } from '../renderers/CardListRenderer'
import { ListRenderer } from '../renderers/ListRenderer'
import { JsonFallback } from '../renderers/JsonFallback'
import { PrimitiveListRenderer } from '../renderers/PrimitiveListRenderer'
import { ChipsRenderer } from '../renderers/ChipsRenderer'
import { InlineRenderer } from '../renderers/InlineRenderer'
import { GridRenderer } from '../renderers/GridRenderer'
import { GalleryRenderer } from '../renderers/GalleryRenderer'
import { TimelineRenderer } from '../renderers/TimelineRenderer'
import { StatsRenderer } from '../renderers/StatsRenderer'
import { getAvailableRenderModes } from '../renderers/PrimitiveRenderer'
import { registry } from '../registry/pluginRegistry'

interface ComponentPickerProps {
  currentType: string
  availableTypes: string[]
  fieldPath: string
  fieldValue?: unknown
  fieldName?: string
  sampleData: unknown
  sampleSchema: TypeSignature
  onSelect: (type: string) => void
  onClose: () => void
}

/**
 * ComponentPicker displays a visual preview picker for component alternatives.
 * For array types, shows scaled-down previews of the actual components.
 * For primitive field render modes, shows inline previews of how the value would render.
 */
export function ComponentPicker({
  currentType,
  availableTypes,
  fieldPath,
  fieldValue,
  fieldName = '',
  sampleData,
  sampleSchema,
  onSelect,
  onClose,
}: ComponentPickerProps) {
  // Determine if we're dealing with array components or primitive render modes
  const isArrayComponent = sampleSchema.kind === 'array' && sampleSchema.items.kind === 'object'
  const isArrayPrimitive = sampleSchema.kind === 'array' && sampleSchema.items.kind === 'primitive'
  const isObjectComponent = sampleSchema.kind === 'object'
  const isPrimitiveField = sampleSchema.kind === 'primitive'

  // For primitive fields, combine mode-based options with registry plugins
  const primitiveRenderModes = isPrimitiveField && fieldValue !== undefined
    ? getAvailableRenderModes(fieldValue, fieldName)
    : []

  // Get compatible plugins from registry for primitive fields
  const dataType = isPrimitiveField
    ? (typeof fieldValue === 'number' ? 'number' : typeof fieldValue === 'boolean' ? 'boolean' : 'string')
    : undefined
  const registryPlugins = isPrimitiveField && dataType
    ? registry.getCompatible(dataType)
    : []

  // Merge: use render modes as base, add any registry plugins not already represented
  const modePluginIds = new Set(primitiveRenderModes)
  for (const plugin of registryPlugins) {
    // Add plugin ID if not already covered by a render mode
    if (!modePluginIds.has(plugin.id)) {
      modePluginIds.add(plugin.id)
    }
  }

  const actualAvailableTypes = isPrimitiveField && primitiveRenderModes.length > 1
    ? [...modePluginIds]
    : availableTypes

  // Sample data for array previews (limit to 3 items for preview)
  const previewData = Array.isArray(sampleData)
    ? sampleData.slice(0, 3)
    : sampleData

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">
            Choose Component Type
          </DialogTitle>

          <div className="text-sm text-gray-600 mb-4">
            Field: <span className="font-mono text-xs">{fieldPath}</span>
          </div>

          {/* Grid of component options */}
          <div className="grid grid-cols-2 gap-4">
            {actualAvailableTypes.map((type) => {
              const isSelected = currentType === type

              return (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className={`border-2 rounded-lg p-4 hover:border-blue-400 transition-colors text-left ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                >
                  {/* Type label */}
                  <div className="font-semibold text-gray-800 mb-2 capitalize">
                    {type.includes('/') ? (registry.get(type)?.name ?? type.split('/').pop()) : type}
                  </div>

                  {/* Preview */}
                  {isArrayComponent ? (
                    <ArrayComponentPreview
                      type={type}
                      data={previewData}
                      schema={sampleSchema}
                    />
                  ) : isArrayPrimitive ? (
                    <ArrayPrimitivePreview
                      type={type}
                      data={previewData}
                      schema={sampleSchema}
                    />
                  ) : isObjectComponent ? (
                    <ObjectComponentPreview type={type} />
                  ) : isPrimitiveField ? (
                    <PrimitiveRenderModePreview
                      type={type}
                      value={fieldValue}
                      fieldName={fieldName}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      Preview not available
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/**
 * Preview for array component types (table, card-list, list, json).
 * Renders a scaled-down version of the actual component.
 */
function ArrayComponentPreview({
  type,
  data,
  schema,
}: {
  type: string
  data: unknown
  schema: TypeSignature
}) {
  let Component: React.ComponentType<any> | null = null

  switch (type) {
    case 'table':
      Component = TableRenderer
      break
    case 'card-list':
      Component = CardListRenderer
      break
    case 'list':
      Component = ListRenderer
      break
    case 'json':
      Component = JsonFallback
      break
    case 'gallery':
      Component = GalleryRenderer
      break
    case 'timeline':
      Component = TimelineRenderer
      break
    case 'stats':
      Component = StatsRenderer
      break
  }

  if (!Component) {
    return <div className="text-xs text-gray-500 italic">Preview not available</div>
  }

  return (
    <div className="overflow-hidden h-[120px] border border-gray-200 rounded">
      <div
        className="transform origin-top-left pointer-events-none"
        style={{ transform: 'scale(0.25)', width: '400%' }}
      >
        <Component data={data} schema={schema} path="$.preview" depth={0} />
      </div>
    </div>
  )
}

/**
 * Preview for object component types (detail, hero, tabs, split).
 * Uses descriptive layout icons since objects vary too much for live previews.
 */
function ObjectComponentPreview({ type }: { type: string }) {
  const descriptions: Record<string, { icon: string; desc: string }> = {
    'detail': { icon: '☰', desc: 'Key-value list with collapsible sections' },
    'hero': { icon: '👤', desc: 'Profile layout with image, title & stats' },
    'tabs': { icon: '⊞', desc: 'Tabbed sections for nested data' },
    'split': { icon: '◧', desc: 'Two-column: content left, metadata right' },
    'json': { icon: '{ }', desc: 'Raw JSON data view' },
  }

  const info = descriptions[type] || { icon: '?', desc: 'Unknown type' }

  return (
    <div className="flex items-center gap-3 h-12">
      <span className="text-2xl" aria-hidden>{info.icon}</span>
      <span className="text-xs text-gray-600">{info.desc}</span>
    </div>
  )
}

/**
 * Preview for primitive-array component types (primitive-list, chips, inline, grid).
 * Renders a scaled-down version of the actual component.
 */
function ArrayPrimitivePreview({
  type,
  data,
  schema,
}: {
  type: string
  data: unknown
  schema: TypeSignature
}) {
  const componentMap: Record<string, React.ComponentType<any>> = {
    'primitive-list': PrimitiveListRenderer,
    'chips': ChipsRenderer,
    'inline': InlineRenderer,
    'grid': GridRenderer,
    'json': JsonFallback,
  }

  const Component = componentMap[type]
  if (!Component) {
    return <div className="text-xs text-gray-500 italic">Preview not available</div>
  }

  return (
    <div className="overflow-hidden h-20 border border-gray-200 rounded">
      <div
        className="transform origin-top-left pointer-events-none p-2"
        style={{ transform: 'scale(0.5)', width: '200%' }}
      >
        <Component data={data} schema={schema} path="$.preview" depth={0} />
      </div>
    </div>
  )
}

/**
 * Preview for primitive field render modes (text, link, image, absolute, relative).
 * Shows a small inline preview of how the value would render.
 */
function PrimitiveRenderModePreview({
  type,
  value,
}: {
  type: string
  value: unknown
  fieldName: string
}) {
  const stringValue = typeof value === 'string' ? value : String(value)

  switch (type) {
    case 'text':
      return (
        <div className="text-sm text-gray-600 truncate" title={stringValue}>
          {stringValue}
        </div>
      )

    case 'link':
      return (
        <div className="text-sm text-blue-600 underline truncate" title={stringValue}>
          {stringValue}
        </div>
      )

    case 'image':
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">Image preview</span>
        </div>
      )

    case 'absolute':
      try {
        const date = new Date(stringValue)
        return (
          <div className="text-sm text-gray-600">
            {date.toLocaleString()}
          </div>
        )
      } catch {
        return <div className="text-sm text-gray-600">{stringValue}</div>
      }

    case 'relative':
      try {
        const date = new Date(stringValue)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
        const hours = Math.floor(seconds / 3600)
        return (
          <div className="text-sm text-gray-600">
            {hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`}
          </div>
        )
      } catch {
        return <div className="text-sm text-gray-600">2 hours ago</div>
      }

    case 'rating':
      return (
        <div className="text-sm">
          <span className="text-yellow-400">&#9733;&#9733;&#9733;&#9733;</span>
          <span className="text-gray-300">&#9733;</span>
          <span className="text-xs text-gray-500 ml-1">4.0</span>
        </div>
      )

    case 'currency':
      return <div className="text-sm text-gray-700">$1,234.56</div>

    case 'code':
      return (
        <div className="text-sm">
          <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs text-gray-800">
            {stringValue.slice(0, 24)}
          </code>
        </div>
      )

    case 'email':
      return <div className="text-sm text-blue-600 underline">{stringValue}</div>

    case 'color': {
      const colorVal = /^#|^rgb|^hsl/i.test(stringValue) ? stringValue : '#6366f1'
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: colorVal }} />
          <code className="text-xs font-mono">{stringValue || colorVal}</code>
        </div>
      )
    }

    default: {
      // Check if it's a plugin ID and show its description
      if (type.includes('/')) {
        const plugin = registry.get(type)
        if (plugin) {
          return (
            <div className="text-xs text-gray-600">
              {plugin.description}
            </div>
          )
        }
      }
      return <div className="text-xs text-gray-500 italic">Preview not available</div>
    }
  }
}
