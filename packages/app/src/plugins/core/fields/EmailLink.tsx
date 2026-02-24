import type { FieldRenderProps } from '../../../types/plugins'

/** Clickable mailto: link */
export function EmailLink({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <a
      href={`mailto:${str}`}
      className="text-primary hover:text-primary/80 underline"
      onClick={(e) => e.stopPropagation()}
    >
      {str}
    </a>
  )
}
