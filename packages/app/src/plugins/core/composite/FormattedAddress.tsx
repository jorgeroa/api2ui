import type { FieldRenderProps } from '../../../types/plugins'

/** Common address field name variants */
const FIELD_MAP = {
  street: ['street', 'address', 'street_address', 'streetAddress', 'line1', 'address_line_1', 'addressLine1'],
  line2: ['line2', 'address_line_2', 'addressLine2', 'suite', 'apt', 'apartment', 'unit'],
  city: ['city', 'town', 'municipality', 'locality'],
  state: ['state', 'province', 'region', 'stateCode', 'state_code'],
  zip: ['zip', 'zipCode', 'zip_code', 'postalCode', 'postal_code', 'postcode'],
  country: ['country', 'countryCode', 'country_code', 'nation'],
} as const

/** Find a field value from an object using known aliases */
function findField(obj: Record<string, unknown>, aliases: readonly string[]): string | undefined {
  for (const alias of aliases) {
    const val = obj[alias]
    if (typeof val === 'string' && val.trim()) return val.trim()
  }
  return undefined
}

/** Smart multi-line postal address layout */
export function FormattedAddress({ value }: FieldRenderProps) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const obj = value as Record<string, unknown>
  const street = findField(obj, FIELD_MAP.street)
  const line2 = findField(obj, FIELD_MAP.line2)
  const city = findField(obj, FIELD_MAP.city)
  const state = findField(obj, FIELD_MAP.state)
  const zip = findField(obj, FIELD_MAP.zip)
  const country = findField(obj, FIELD_MAP.country)

  // Build city/state/zip line
  const cityStateZip = [city, state].filter(Boolean).join(', ')
  const cityLine = [cityStateZip, zip].filter(Boolean).join(' ')

  if (!street && !city && !country) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  return (
    <address className="not-italic text-sm text-gray-700 leading-relaxed">
      {street && <div>{street}</div>}
      {line2 && <div>{line2}</div>}
      {cityLine && <div>{cityLine}</div>}
      {country && <div>{country}</div>}
    </address>
  )
}
