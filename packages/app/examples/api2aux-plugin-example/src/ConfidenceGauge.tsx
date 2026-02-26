/**
 * ConfidenceGauge — a semicircular SVG gauge that visualizes 0-100 values.
 * Fills from red (0) → yellow (50) → green (100).
 * Zero external dependencies beyond React.
 */

import React from 'react'
import type { FieldRenderProps } from './types'

/** Interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16)
  const bh = parseInt(b.slice(1), 16)
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const b2 = Math.round(ab + (bb - ab) * t)
  return `#${((r << 16) | (g << 8) | b2).toString(16).padStart(6, '0')}`
}

/** Get color for a 0-100 value: red → yellow → green */
function gaugeColor(value: number): string {
  if (value <= 50) return lerpColor('#ef4444', '#eab308', value / 50)
  return lerpColor('#eab308', '#22c55e', (value - 50) / 50)
}

export function ConfidenceGauge({ value, fieldName }: FieldRenderProps) {
  // Handle non-numeric values
  if (value == null) {
    return (
      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
        No data
      </div>
    )
  }

  const raw = Number(value)
  if (Number.isNaN(raw)) {
    return (
      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
        N/A
      </div>
    )
  }

  // Clamp to 0-100
  const clamped = Math.max(0, Math.min(100, raw))

  // SVG arc geometry — semicircle from left to right
  const cx = 60, cy = 55, r = 40
  const arcLength = Math.PI * r // ~125.66
  const fillLength = (clamped / 100) * arcLength
  const color = gaugeColor(clamped)

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <svg viewBox="0 0 120 70" width="100" height="58">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${arcLength}`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
        {/* Value text */}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1f2937">
          {Math.round(clamped)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
          {fieldName}
        </text>
      </svg>
    </div>
  )
}
