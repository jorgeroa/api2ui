import type { RendererProps } from '../../types/components'
import type { FieldType } from '../../types/schema'

export function PrimitiveRenderer({ data, schema }: RendererProps) {
  if (schema.kind !== 'primitive') {
    return <span className="text-gray-500 italic">Invalid primitive type</span>
  }

  const type: FieldType = schema.type

  // Handle null
  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }

  // Handle boolean
  if (type === 'boolean' && typeof data === 'boolean') {
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          data
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {String(data)}
      </span>
    )
  }

  // Handle number
  if (type === 'number' && typeof data === 'number') {
    return <span>{data.toLocaleString()}</span>
  }

  // Handle date
  if (type === 'date' && typeof data === 'string') {
    try {
      const date = new Date(data)
      return <span title={data}>{date.toLocaleDateString()}</span>
    } catch {
      return <span>{data}</span>
    }
  }

  // Handle string (with truncation)
  if (typeof data === 'string') {
    const truncated = data.length > 100 ? `${data.slice(0, 100)}...` : data
    return <span title={data}>{truncated}</span>
  }

  // Fallback: stringify unknown types
  return <span className="text-gray-500">{JSON.stringify(data)}</span>
}
