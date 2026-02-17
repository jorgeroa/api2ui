import type { FieldRenderProps } from '../../../types/plugins'
import { StatusBadge } from '../../../components/renderers/semantic/StatusBadge'

/** Status badge wrapper — delegates to existing StatusBadge component */
export function StatusBadgePlugin({ value }: FieldRenderProps) {
  if (typeof value === 'boolean' || typeof value === 'string') {
    return <StatusBadge value={value} />
  }
  return <span>{String(value)}</span>
}
