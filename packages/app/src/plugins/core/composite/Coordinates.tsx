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

/** Format coordinate with direction indicator */
function formatCoord(value: number, positive: string, negative: string): string {
  const abs = Math.abs(value)
  const dir = value >= 0 ? positive : negative
  return `${abs.toFixed(4)}°${dir}`
}

/** Formatted coordinates display: "40.7128°N, 74.0060°W" */
export function Coordinates({ value }: FieldRenderProps) {
  const coords = extractCoords(value)

  if (!coords) {
    return <span className="text-gray-500 text-sm">{JSON.stringify(value)}</span>
  }

  return (
    <span className="font-mono text-sm text-gray-700">
      {formatCoord(coords.lat, 'N', 'S')}, {formatCoord(coords.lng, 'E', 'W')}
    </span>
  )
}
