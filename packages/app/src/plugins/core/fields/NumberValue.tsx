import type { FieldRenderProps } from '../../../types/plugins'

/** Locale-formatted number */
export function NumberValue({ value }: FieldRenderProps) {
  if (typeof value !== 'number') return <span>{String(value)}</span>
  return <span>{value.toLocaleString()}</span>
}
