import { useState } from 'react'
import type { RendererProps } from '../../types/components'
import type { FieldType } from '../../types/schema'
import { useConfigStore } from '../../store/configStore'
import { useAppStore } from '../../store/appStore'
import { isImageUrl } from '../../utils/imageDetection'
import { isEmail, isColorValue, isCurrencyField, isRatingField, detectPrimitiveMode } from '../../utils/primitiveDetection'
import { StatusBadge } from './semantic/StatusBadge'
import { StarRating } from './semantic/StarRating'
import { CurrencyValue, detectCurrencyFromSiblings } from './semantic/CurrencyValue'
import { FormattedDate } from './semantic/FormattedDate'

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

/** Normalize path for cache lookup (convert indexed to generic) */
function normalizePath(path: string): string {
  return path.replace(/\[\d+\]/g, '[]')
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
  const { getAnalysisCache, data: rootData } = useAppStore()
  const [imageError, setImageError] = useState(false)

  if (schema.kind !== 'primitive') {
    return <span className="text-gray-500 italic">Invalid primitive type</span>
  }

  const type: FieldType = schema.type

  // Semantic-aware rendering: check analysis cache for high-confidence detection
  const pathParts = path.split('.')
  const fieldPath = path
  const fieldName = pathParts[pathParts.length - 1] || ''

  // Try multiple parent paths for cache lookup (most specific to least)
  const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('.') : path
  const normalizedPath = normalizePath(fieldPath)
  const normalizedParent = normalizePath(parentPath)

  const cached = getAnalysisCache(parentPath)
    || getAnalysisCache(normalizedParent)
    || getAnalysisCache(normalizedParent.replace(/\[\]$/, ''))
    || getAnalysisCache('$')

  const semantics = cached?.semantics?.get(fieldPath)
    || cached?.semantics?.get(normalizedPath)
  const hasHighConfidence = semantics && semantics.level === 'high'

  // Handle null
  if (data === null || data === undefined) {
    return <span className="text-gray-400 italic">null</span>
  }

  // Handle boolean
  if (type === 'boolean' && typeof data === 'boolean') {
    // Check if this is a status-related boolean (semantic detection or field name pattern)
    const isStatusBoolean = (hasHighConfidence && semantics?.detectedCategory === 'status')
      || /^(is_|has_|can_)?(active|enabled|verified|published|approved|visible|available|blocked|banned|deleted|suspended)/i.test(fieldName)

    if (isStatusBoolean) {
      return <StatusBadge value={data} />
    }

    // Default boolean rendering
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

    // Check for user override first (highest precedence)
    if (config?.componentType) {
      const renderMode = config.componentType

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

      // Other overrides fall through to default
      return <span>{data.toLocaleString()}</span>
    }

    // No user override - check semantic detection
    if (hasHighConfidence && semantics?.detectedCategory === 'rating') {
      return <StarRating value={data} />
    }

    if (hasHighConfidence && semantics?.detectedCategory === 'price') {
      // Detect currency from sibling fields
      // Navigate to parent object using parentPath
      let parentObj: any = rootData
      if (parentPath !== '$' && parentPath !== path) {
        const parts = parentPath.replace(/^\$\.?/, '').split('.')
        for (const part of parts) {
          if (!parentObj) break
          // Handle array indices like [0]
          const match = part.match(/^(.+?)\[(\d+)\]$/)
          if (match) {
            const key = match[1]
            const idx = match[2]
            parentObj = parentObj?.[key!]?.[parseInt(idx!, 10)]
          } else {
            parentObj = parentObj[part]
          }
        }
      }
      const detectedCurrency = parentObj ? detectCurrencyFromSiblings(fieldName, parentObj) : null
      return <CurrencyValue amount={data} currencyCode={detectedCurrency ?? undefined} />
    }

    // Fallback to existing heuristic detection
    const renderMode = detectPrimitiveMode(data, fieldName)

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

      // Check semantic detection for FormattedDate component
      if (!renderMode && hasHighConfidence && (semantics?.detectedCategory === 'date' || semantics?.detectedCategory === 'timestamp')) {
        return <FormattedDate value={data} />
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

          // Check semantic detection for FormattedDate component
          if (!renderMode && hasHighConfidence && (semantics?.detectedCategory === 'date' || semantics?.detectedCategory === 'timestamp')) {
            return <FormattedDate value={data} />
          }

          // Default: absolute
          return <span title={data}>{date.toLocaleString()}</span>
        }
      } catch {
        // Fall through to default string handling
      }
    }

    // Status string handler (before auto-detection)
    // Guard: only render StatusBadge if the value matches known status vocabulary.
    // The semantic detector can false-positive on single-word strings like city names.
    if (!renderMode && hasHighConfidence && semantics?.detectedCategory === 'status' && typeof data === 'string') {
      const normalized = data.toLowerCase().trim()
      const isKnownStatus = /^(active|success|published|verified|approved|complete|completed|enabled|paid|delivered|open|live|available|done|error|failed|deleted|banned|rejected|cancelled|canceled|inactive|disabled|closed|expired|denied|blocked|pending|processing|review|in.?review|scheduled|syncing|indexing|draft|paused|waiting|suspended|on.?hold)$/i.test(normalized)
      if (isKnownStatus) {
        return <StatusBadge value={data} />
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
