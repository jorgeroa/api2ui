interface CurrencyValueProps {
  amount: number | string
  currencyCode?: string
}

export function CurrencyValue({ amount, currencyCode = 'USD' }: CurrencyValueProps) {
  // Parse amount
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // If NaN, render raw value as text
  if (isNaN(numAmount)) {
    return <span>{String(amount)}</span>
  }

  // Format with Intl.NumberFormat
  try {
    const formatted = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currencyCode,
    }).format(numAmount)

    return <span title={`${numAmount} ${currencyCode}`}>{formatted}</span>
  } catch (error) {
    // Fallback to USD if currency code is invalid
    const formatted = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount)

    return <span title={`${numAmount} ${currencyCode}`}>{formatted}</span>
  }
}

/**
 * Helper function to detect currency code from sibling fields.
 * Used by PrimitiveRenderer in Plan 02 to pass the currencyCode prop.
 */
export function detectCurrencyFromSiblings(
  _fieldName: string,
  parentObj: Record<string, unknown>
): string {
  // Look for sibling fields named currency_code, currency, or currency_id
  const currencyField = parentObj.currency_code || parentObj.currency || parentObj.currency_id

  if (currencyField && typeof currencyField === 'string') {
    // Check if it matches a 3-letter currency code format
    if (/^[A-Z]{3}$/.test(currencyField)) {
      return currencyField
    }
  }

  // Default to USD
  return 'USD'
}
