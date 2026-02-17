import type { FieldRenderProps } from '../../../types/plugins'

/** Extract lat/lng from value */
function extractCoords(value: unknown): { lat: number; lng: number } | null {
  if (Array.isArray(value) && value.length === 2) {
    const [a, b] = value
    if (typeof a === 'number' && typeof b === 'number') {
      if (a >= -90 && a <= 90 && b >= -180 && b <= 180) return { lat: a, lng: b }
    }
    return null
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const lat = obj.lat ?? obj.latitude ?? obj.Lat ?? obj.Latitude
    const lng = obj.lng ?? obj.lon ?? obj.longitude ?? obj.Lng ?? obj.Lon ?? obj.Longitude
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng }
    }
  }

  return null
}

/** "Open in Maps" link for coordinate values */
export function MapLink({ value }: FieldRenderProps) {
  const coords = extractCoords(value)

  if (!coords) {
    // Try string address
    if (typeof value === 'string') {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
      return (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Open in Maps
        </a>
      )
    }
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
    </a>
  )
}
