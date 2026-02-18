import type { RendererProps } from '../../types/components'

/** Renders an array of primitives as a comma-separated inline list */
export function InlineRenderer({ data, schema }: RendererProps) {
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
    <span className="text-sm">
      {data.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground">, </span>}
          <span>{String(item)}</span>
        </span>
      ))}
    </span>
  )
}
