import type { FieldRenderProps } from '../../../types/plugins'

/** Clickable mailto: link */
export function EmailLink({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <a
      href={`mailto:${str}`}
      className="text-blue-600 hover:text-blue-800 underline"
      onClick={(e) => e.stopPropagation()}
    >
      {str}
    </a>
  )
}
