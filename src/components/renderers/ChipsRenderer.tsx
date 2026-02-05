import type { RendererProps } from '../../types/components'

const chipColors = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
  'bg-indigo-100 text-indigo-800',
  'bg-orange-100 text-orange-800',
]

/** Renders an array of primitives as colored tag chips */
export function ChipsRenderer({ data, schema }: RendererProps) {
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
    <div className="flex flex-wrap gap-2">
      {data.map((item, index) => (
        <span
          key={index}
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${chipColors[index % chipColors.length]}`}
        >
          {String(item)}
        </span>
      ))}
    </div>
  )
}
