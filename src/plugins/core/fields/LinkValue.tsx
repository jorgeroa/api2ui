import type { FieldRenderProps } from '../../../types/plugins'

/** Clickable URL that opens in a new tab */
export function LinkValue({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <a
      href={str}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline"
      onClick={(e) => e.stopPropagation()}
    >
      {str}
    </a>
  )
}
