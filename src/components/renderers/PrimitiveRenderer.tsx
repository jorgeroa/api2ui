import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import type { FieldType } from '../../types/schema'
import { useConfigStore } from '../../store/configStore'
import { isImageUrl } from '../../utils/imageDetection'
import { isEmail, isColorValue, isCurrencyField, isRatingField, detectPrimitiveMode } from '../../utils/primitiveDetection'

/** Time ago helper for relative date rendering */
function timeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

/** Check if a string value looks like a URL */
function isURL(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

/** Check if a string value looks like a date */
function isDateLike(value: string, fieldName: string): boolean {
  // Check ISO 8601 pattern
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/
  if (isoPattern.test(value)) {
    return !isNaN(Date.parse(value))
  }

  // Check if field name suggests a date
  const dateKeywords = ['date', 'created', 'updated', 'timestamp', 'time', 'at']
  const lowerFieldName = fieldName.toLowerCase()
  return dateKeywords.some((keyword) => lowerFieldName.includes(keyword))
}

/**
 * Get available render modes for a value.
 * This is exported for ComponentPicker to determine what options to show.
 */
export function getAvailableRenderModes(value: unknown, fieldName: string = ''): string[] {
  if (typeof value === 'number') {
    const modes: string[] = ['text']
    if (isRatingField(fieldName, value)) modes.push('rating')
    if (isCurrencyField(fieldName)) modes.push('currency')
    // Always offer these as manual options for any number
    if (!modes.includes('rating')) modes.push('rating')
    if (!modes.includes('currency')) modes.push('currency')
    return modes
  }

  if (typeof value !== 'string') {
    return ['text']
  }

  if (isURL(value)) {
    return ['text', 'link', 'image']
  }

  if (isDateLike(value, fieldName)) {
    return ['absolute', 'relative']
  }

  const modes: string[] = ['text']
  if (isEmail(value)) modes.push('email')
  if (isColorValue(value)) modes.push('color')
  modes.push('code')
  return modes
}

export function PrimitiveRenderer({ data, schema, path }: RendererProps) {
  const { fieldConfigs } = useConfigStore()
  const [imageError, setImageError] = useState(false)

  if (schema.kind !== 'primitive') {
    return <span className="text-gray-500 italic">Invalid primitive type</span>
  }

  const type: FieldType = schema.type

  // Handle null
  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }

  // Handle boolean
  if (type === 'boolean' && typeof data === 'boolean') {
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          data
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {String(data)}
      </span>
    )
  }

  // Handle number
  if (type === 'number' && typeof data === 'number') {
    const config = fieldConfigs[path]
    const renderMode = config?.componentType || detectPrimitiveMode(data, path.split('.').pop() || '')

    if (renderMode === 'rating') {
      const clamped = Math.min(5, Math.max(0, data))
      const fullStars = Math.floor(clamped)
      const hasHalf = (clamped - fullStars) >= 0.25
      const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)
      return (
        <span className="inline-flex items-center gap-0.5" title={String(data)}>
          {Array.from({ length: fullStars }, (_, i) => <span key={`f${i}`} className="text-yellow-400">&#9733;</span>)}
          {hasHalf && <span className="text-yellow-300">&#9733;</span>}
          {Array.from({ length: emptyStars }, (_, i) => <span key={`e${i}`} className="text-gray-300">&#9733;</span>)}
          <span className="text-xs text-gray-500 ml-1">{data.toFixed(1)}</span>
        </span>
      )
    }

    if (renderMode === 'currency') {
      return <span>${data.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    }

    return <span>{data.toLocaleString()}</span>
  }

  // Handle date
  if (type === 'date' && typeof data === 'string') {
    // Check for render mode override
    const config = fieldConfigs[path]
    const renderMode = config?.componentType

    try {
      const date = new Date(data)

      if (renderMode === 'relative') {
        return <span title={data}>{timeAgo(date)}</span>
      }

      // Default: absolute
      return <span title={data}>{date.toLocaleString()}</span>
    } catch {
      return <span>{data}</span>
    }
  }

  // Handle string
  if (typeof data === 'string') {
    // Check for render mode override
    const config = fieldConfigs[path]
    const renderMode = config?.componentType
    const fieldName = path.split('.').pop() || ''

    // URL detection and render modes
    if (isURL(data)) {
      // Explicit link override takes precedence
      if (renderMode === 'link') {
        return (
          <a
            href={data}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {data}
          </a>
        )
      }

      // Auto-detect image URLs or explicit image mode
      const shouldAutoImage = isImageUrl(data) && renderMode !== 'text'
      if (shouldAutoImage || renderMode === 'image') {
        if (imageError) {
          return <span className="text-gray-500" title={data}>{data}</span>
        }
        return (
          <img
            src={data}
            alt={fieldName}
            className="max-h-48 object-contain"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )
      }

      // Default: text
      const truncated = data.length > 100 ? `${data.slice(0, 100)}...` : data
      return <span title={data}>{truncated}</span>
    }

    // Date-like string detection and render modes
    if (isDateLike(data, fieldName)) {
      try {
        const date = new Date(data)
        if (!isNaN(date.getTime())) {
          if (renderMode === 'relative') {
            return <span title={data}>{timeAgo(date)}</span>
          }

          if (renderMode === 'absolute') {
            return <span title={data}>{date.toLocaleString()}</span>
          }

          // Default: absolute
          return <span title={data}>{date.toLocaleString()}</span>
        }
      } catch {
        // Fall through to default string handling
      }
    }

    // Apply auto-detection if no explicit override
    const effectiveMode = renderMode || detectPrimitiveMode(data, fieldName)

    if (effectiveMode === 'email' || (!effectiveMode && isEmail(data))) {
      return (
        <a
          href={`mailto:${data}`}
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {data}
        </a>
      )
    }

    if (effectiveMode === 'color') {
      return (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-5 h-5 rounded border border-gray-300 inline-block shrink-0"
            style={{ backgroundColor: data }}
          />
          <code className="text-xs font-mono text-gray-700">{data}</code>
        </span>
      )
    }

    if (effectiveMode === 'code' || renderMode === 'code') {
      return (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
          {data}
        </code>
      )
    }

    // Default string handling with truncation
    const truncated = data.length > 100 ? `${data.slice(0, 100)}...` : data
    return <span title={data}>{truncated}</span>
  }

  // Fallback: stringify unknown types
  return <span className="text-gray-500">{JSON.stringify(data)}</span>
}
