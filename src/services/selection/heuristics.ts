/**
 * Heuristic functions for pattern-based component selection.
 * Each heuristic returns null or a ComponentSelection with confidence score.
 */

import type { TypeSignature } from '@/types/schema'
import type { ComponentSelection, SelectionContext } from './types'

/**
 * Helper to extract field entries from array-of-objects schema.
 */
function getArrayItemFields(schema: TypeSignature): Array<[string, TypeSignature]> | null {
  if (schema.kind !== 'array') return null
  if (schema.items.kind !== 'object') return null
  return Array.from(schema.items.fields.entries()).map(([name, def]) => [name, def.type])
}

/**
 * Detects review pattern: rating + comment/review fields.
 * User decision: Star ratings as default display.
 *
 * @returns card-list with 0.85 confidence when both rating and review/description fields present
 */
export function checkReviewPattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getArrayItemFields(schema)
  if (!fields) return null

  // Check for rating field
  const hasRating = fields.some(([name]) => {
    const semantic = context.semantics.get(`$[].${name}`)
    return semantic?.detectedCategory === 'rating'
  })

  // Check for comment/review/description field with primary or secondary tier
  const hasReview = fields.some(([name]) => {
    const semantic = context.semantics.get(`$[].${name}`)
    const importance = context.importance.get(`$[].${name}`)
    const tier = importance?.tier

    return (
      (semantic?.detectedCategory === 'reviews' ||
        semantic?.detectedCategory === 'description' ||
        /comment|review|text|body/i.test(name)) &&
      (tier === 'primary' || tier === 'secondary')
    )
  })

  if (hasRating && hasReview) {
    return {
      componentType: 'card-list',
      confidence: 0.85,
      reason: 'review-pattern-detected',
    }
  }

  return null
}

/**
 * Detects image-heavy arrays.
 * User decision: Fixed-column grid layout.
 *
 * @returns gallery with 0.9 confidence when image fields present AND <=4 total fields
 * @returns card-list with 0.75 confidence when images mixed with >4 other fields
 */
export function checkImageGalleryPattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getArrayItemFields(schema)
  if (!fields) return null

  // Count image fields
  const imageFields = fields.filter(([name]) => {
    const semantic = context.semantics.get(`$[].${name}`)
    return (
      semantic?.detectedCategory === 'image' ||
      semantic?.detectedCategory === 'thumbnail' ||
      semantic?.detectedCategory === 'avatar'
    )
  })

  if (imageFields.length === 0) return null

  // Pure gallery: image fields with <=4 total fields
  if (fields.length <= 4) {
    return {
      componentType: 'gallery',
      confidence: 0.9,
      reason: 'image-heavy-content',
    }
  }

  // Images mixed with other fields: use cards
  return {
    componentType: 'card-list',
    confidence: 0.75,
    reason: 'images-with-other-fields',
  }
}

/**
 * Detects event-like arrays (timeline pattern).
 * User decision: Requires event-like semantics (NOT just chronological ordering).
 *
 * @returns timeline with 0.8 confidence when date/timestamp + title/description present
 */
export function checkTimelinePattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getArrayItemFields(schema)
  if (!fields) return null

  // Check for date/timestamp field
  const hasDate = fields.some(([name]) => {
    const semantic = context.semantics.get(`$[].${name}`)
    return (
      semantic?.detectedCategory === 'date' ||
      semantic?.detectedCategory === 'timestamp'
    )
  })

  // Check for title OR description field (event-like semantics)
  const hasNarrative = fields.some(([name]) => {
    const semantic = context.semantics.get(`$[].${name}`)
    return (
      semantic?.detectedCategory === 'title' ||
      semantic?.detectedCategory === 'description'
    )
  })

  if (hasDate && hasNarrative) {
    return {
      componentType: 'timeline',
      confidence: 0.8,
      reason: 'event-timeline-pattern',
    }
  }

  return null
}

/**
 * Default card vs table heuristic based on content richness and field count.
 * User decision: Content richness trumps field count.
 *
 * Rich content categories: description, reviews, image, title
 *
 * @returns card-list with 0.75 confidence when rich content AND <=8 visible fields
 * @returns table with 0.8 confidence when >=10 visible fields
 * @returns table with 0.5 confidence for ambiguous cases
 */
export function selectCardOrTable(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection {
  const fields = getArrayItemFields(schema)
  if (!fields) {
    return {
      componentType: 'table',
      confidence: 0.5,
      reason: 'fallback-to-table',
    }
  }

  // Count primary + secondary tier fields (ignore tertiary for visible field count)
  let visibleFieldCount = 0
  let hasRichContent = false

  for (const [name] of fields) {
    const fieldPath = `$[].${name}`
    const tier = context.importance.get(fieldPath)?.tier
    const semantic = context.semantics.get(fieldPath)

    if (tier === 'primary' || tier === 'secondary') {
      visibleFieldCount++
    }

    // Check for rich content types
    if (
      semantic?.detectedCategory === 'description' ||
      semantic?.detectedCategory === 'reviews' ||
      semantic?.detectedCategory === 'image' ||
      semantic?.detectedCategory === 'title'
    ) {
      hasRichContent = true
    }
  }

  // User decision: Content richness trumps field count
  if (hasRichContent && visibleFieldCount <= 8) {
    return {
      componentType: 'card-list',
      confidence: 0.75,
      reason: 'rich-content-low-field-count',
    }
  }

  // High field count: table for scannability
  if (visibleFieldCount >= 10) {
    return {
      componentType: 'table',
      confidence: 0.8,
      reason: 'high-field-count',
    }
  }

  // Ambiguous case: default to table
  return {
    componentType: 'table',
    confidence: 0.5,
    reason: 'ambiguous-default-table',
  }
}
