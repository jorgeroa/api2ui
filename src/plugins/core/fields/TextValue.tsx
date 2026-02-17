import type { FieldRenderProps } from '../../../types/plugins'

/** Default string renderer with truncation */
export function TextValue({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  const truncated = str.length > 100 ? `${str.slice(0, 100)}...` : str
  return <span title={str.length > 100 ? str : undefined}>{truncated}</span>
}
