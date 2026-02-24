import { useState } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'

const TRUNCATE_LIMIT = 100
const TRUNCATE_MAX = 500

/** Default string renderer with expandable truncation */
export function TextValue({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  const [expanded, setExpanded] = useState(false)

  if (str.length <= TRUNCATE_LIMIT) return <span>{str}</span>

  const display = expanded ? str.slice(0, TRUNCATE_MAX) : str.slice(0, TRUNCATE_LIMIT)
  return (
    <span>
      {display}{!expanded && '... '}
      {expanded && str.length > TRUNCATE_MAX && '... '}
      {expanded && str.length <= TRUNCATE_MAX && ' '}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        className="text-primary hover:text-primary/80 text-xs ml-1 cursor-pointer"
      >
        {expanded ? 'less' : 'more'}
      </button>
    </span>
  )
}
