import type { RendererProps } from '../../types/components'
import { PrimitiveRenderer } from './PrimitiveRenderer'

/** Renders an array of primitive values as a vertical list */
export function PrimitiveListRenderer({ data, schema, path, depth }: RendererProps) {
  if (schema.kind !== 'array') {
    return <span className="text-muted-foreground italic">Expected array</span>
  }

  if (!Array.isArray(data)) {
    return <span className="text-muted-foreground italic">No data</span>
  }

  if (data.length === 0) {
    return <span className="text-muted-foreground text-xs">[0 items]</span>
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
