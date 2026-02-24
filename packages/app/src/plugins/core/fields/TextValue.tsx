import { useState } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'

const TRUNCATE_LIMIT = 100
const TRUNCATE_MAX = 500

/** Default string renderer with expandable truncation */
export function TextValue({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  const [expanded, setExpanded] = useState(false)

  if (str.length <= TRUNCATE_LIMIT) return <span>{str}</span>

  const full = expanded ? str.slice(0, TRUNCATE_MAX) : str.slice(0, TRUNCATE_LIMIT)
  const suffix = !expanded ? '...' : str.length > TRUNCATE_MAX ? '...' : ''
  // Split at last space so the toggle stays with the final word
  const lastSpace = full.lastIndexOf(' ')
  const before = lastSpace > 0 ? full.slice(0, lastSpace + 1) : ''
  const lastWord = lastSpace > 0 ? full.slice(lastSpace + 1) : full
  return (
    <span>
      {before}
      <span className="inline whitespace-nowrap">
        {lastWord}{suffix}{' '}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-primary hover:text-primary/80 text-xs cursor-pointer"
        >
          {expanded ? 'less' : 'more'}
        </button>
      </span>
    </span>
  )
}
