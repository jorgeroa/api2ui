import { useEffect, useRef } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/** Extract lat/lng from value — supports objects and arrays */
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

/** Interactive map with pin using Leaflet */
export function MapPin({ value }: FieldRenderProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const coords = extractCoords(value)

  useEffect(() => {
    if (!coords || !mapRef.current) return
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Default marker icon fix for bundled Leaflet
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    L.marker([coords.lat, coords.lng], { icon }).addTo(map)
      .bindPopup(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`)

    mapInstanceRef.current = map

    // Force resize after render
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [coords?.lat, coords?.lng])

  if (!coords) {
    return <span className="text-muted-foreground text-sm">{JSON.stringify(value)}</span>
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-48 rounded-lg border border-border overflow-hidden"
      style={{ minHeight: '192px' }}
    />
  )
}
