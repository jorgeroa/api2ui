import type { FieldRenderProps } from '../../../types/plugins'
import { CurrencyValue, detectCurrencyFromSiblings } from '../../../components/renderers/semantic/CurrencyValue'

/** Currency wrapper — delegates to existing CurrencyValue component */
export function CurrencyPlugin({ value, fieldName, context }: FieldRenderProps) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return <span>{String(value)}</span>
  }

  // Detect currency from sibling fields if parent object is available
  const currencyCode = context?.parentObject
    ? detectCurrencyFromSiblings(fieldName, context.parentObject)
    : undefined

  return <CurrencyValue amount={value} currencyCode={currencyCode} />
}
