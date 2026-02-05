import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'

/** Renders an array of primitives in a responsive CSS grid */
export function GridRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'array') {
    return <span className="text-gray-500 italic">Expected array</span>
  }

  if (!Array.isArray(data)) {
    return <span className="text-gray-500 italic">No data</span>
  }

  if (data.length === 0) {
    return <span className="text-gray-500 text-xs">[0 items]</span>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {data.map((item, index) => (
        <div
          key={index}
          className="border border-border rounded-lg p-3 text-sm text-center truncate"
          title={String(item)}
        >
          <PrimitiveRenderer
            data={item}
            schema={schema.items}
            path={`${path}[${index}]`}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  )
}
