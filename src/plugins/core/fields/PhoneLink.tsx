import type { FieldRenderProps } from '../../../types/plugins'

/** Clickable tel: link for phone numbers */
export function PhoneLink({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  // Strip everything except digits, +, and x for the tel: href
  const telHref = str.replace(/[^\d+x]/g, '')

  return (
    <a
      href={`tel:${telHref}`}
      className="text-primary hover:text-primary/80 underline"
      onClick={(e) => e.stopPropagation()}
    >
      {str}
    </a>
  )
}
