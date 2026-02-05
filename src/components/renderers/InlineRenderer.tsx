import type { RendererProps } from '../../types/components'

/** Renders an array of primitives as a comma-separated inline list */
export function InlineRenderer({ data, schema }: RendererProps) {
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
    <span className="text-sm">
      {data.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="text-gray-400">, </span>}
          <span>{String(item)}</span>
        </span>
      ))}
    </span>
  )
}
