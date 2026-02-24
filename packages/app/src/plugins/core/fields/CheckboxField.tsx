import type { FieldRenderProps } from '../../../types/plugins'
import { Checkbox } from '../../../components/ui/checkbox'

/** Read-only checkbox for boolean values */
export function CheckboxField({ value }: FieldRenderProps) {
  const checked = Boolean(value)

  return (
    <Checkbox
      checked={checked}
      disabled
      className="pointer-events-none"
    />
  )
}
