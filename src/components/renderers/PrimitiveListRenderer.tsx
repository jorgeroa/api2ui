import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'

/** Renders an array of primitive values as a vertical list */
export function PrimitiveListRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'array') {
    return <span className="text-gray-500 italic">Expected array</span>
  }

  if (!Array.isArray(data)) {
    return <span className="text-gray-500 italic">No data</span>
  }

  if (data.length === 0) {
    return <span className="text-gray-400 italic">Empty list</span>
  }

  return (
    <ul className="list-disc list-inside space-y-1">
      {data.map((item, index) => (
        <li key={index} className="text-sm">
          <PrimitiveRenderer
            data={item}
            schema={schema.items}
            path={`${path}[${index}]`}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  )
}
