import type { RendererProps } from '../../types/components'
import { TagChips } from './semantic/TagChips'


/** Renders an array of primitives as colored tag chips */
export function ChipsRenderer({ data, schema }: RendererProps) {
  if (schema.kind !== 'array') {
    return <span className="text-muted-foreground italic">Expected array</span>
  }

  if (!Array.isArray(data)) {
    return <span className="text-muted-foreground italic">No data</span>
  }

  if (data.length === 0) {
    return <span className="text-muted-foreground text-xs">[0 items]</span>
  }

  // Check if all items are strings (tag-like arrays)
  const isStringArray = data.every((item) => typeof item === 'string')

  if (isStringArray) {
    // Use TagChips for string arrays (monochrome, copy-on-click, truncation)
    return <TagChips tags={data as string[]} maxVisible={8} />
  }

  // Keep chip rendering for non-string arrays (numbers, mixed types)
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item, index) => (
        <span
          key={index}
          className="inline-block px-2 py-0.5 text-xs rounded-md font-medium bg-muted text-muted-foreground border border-border"
        >
          {String(item)}
        </span>
      ))}
    </div>
  )
}
