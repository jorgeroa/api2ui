import type { FieldRenderProps } from '../../../types/plugins'
import { FormattedDate } from '../../../components/renderers/semantic/FormattedDate'

/** Formatted date wrapper — delegates to existing FormattedDate component */
export function FormattedDatePlugin({ value }: FieldRenderProps) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return <span>{String(value)}</span>
  }
  return <FormattedDate value={value} />
}
