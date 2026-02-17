import { useState } from 'react'
import type { FieldRenderProps } from '../../../types/plugins'

/** Inline image with error fallback */
export function ImageValue({ value, fieldName }: FieldRenderProps) {
  const [error, setError] = useState(false)
  const src = String(value ?? '')

  if (error) {
    return <span className="text-gray-500" title={src}>{src}</span>
  }

  return (
    <img
      src={src}
      alt={fieldName}
      className="max-h-48 object-contain"
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}
