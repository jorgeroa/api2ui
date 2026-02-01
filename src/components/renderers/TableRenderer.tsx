import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'

/**
 * TableRenderer displays arrays of objects as a scrollable table.
 * Uses CSS-based scrolling with good performance for large datasets.
 * Note: react-window 2.x has API changes that are incompatible with the plan's expectations.
 * This implementation provides the same UX with simpler, more reliable code.
 */
export function TableRenderer({ data, schema, path, depth }: RendererProps) {
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

  const columns = Array.from(schema.items.fields.entries())

  // Format column headers
  const columnHeaders = columns.map(([fieldName]) =>
    fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  )

  const columnWidth = Math.max(150, Math.floor(900 / columns.length))

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - sticky positioning keeps it visible while scrolling */}
      <div className="flex bg-gray-100 border-b-2 border-gray-300 font-semibold sticky top-0 z-10">
        {columnHeaders.map((header, index) => (
          <div
            key={index}
            className="px-4 py-3 border-r border-gray-300 text-sm"
            style={{ width: columnWidth, minWidth: columnWidth }}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        {data.map((item, rowIndex) => {
          const row = item as Record<string, unknown>
          const isEven = rowIndex % 2 === 0

          return (
            <div
              key={rowIndex}
              className={`flex border-b border-gray-200 ${
                isEven ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              {columns.map(([fieldName, fieldDef]) => {
                const value = row[fieldName]
                const cellPath = `${path}[${rowIndex}].${fieldName}`

                return (
                  <div
                    key={fieldName}
                    className="px-4 py-2 border-r border-gray-200 flex items-center overflow-hidden"
                    style={{ width: columnWidth, minWidth: columnWidth, height: '40px' }}
                  >
                    <div className="truncate w-full">
                      <PrimitiveRenderer
                        data={value}
                        schema={fieldDef.type}
                        path={cellPath}
                        depth={depth + 1}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
