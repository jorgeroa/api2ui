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

  // Check for rating field - iterate over semantics map since paths vary
  const hasRating = Array.from(context.semantics.values()).some(
    semantic => semantic.detectedCategory === 'rating'
  )

  // Check for comment/review/description field with primary or secondary tier
  // Look for semantic category OR field name pattern
  const hasReview = fields.some(([name]) => {
    // Check semantic category from any matching path
    const hasDescSemantic = Array.from(context.semantics.values()).some(
      semantic => semantic.detectedCategory === 'reviews' || semantic.detectedCategory === 'description'
    )

    // Check importance tier for this field (find by name suffix)
    const importanceEntry = Array.from(context.importance.entries()).find(([path]) =>
      path.endsWith(`].${name}`)
    )
    const tier = importanceEntry?.[1]?.tier

    return (
      (hasDescSemantic || /comment|review|text|body/i.test(name)) &&
      (tier === 'primary' || tier === 'secondary' || !importanceEntry)
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

  // Count image fields - check by semantic category
  const imageCategories = new Set(['image', 'thumbnail', 'avatar'])
  const imageFieldCount = Array.from(context.semantics.values()).filter(
    semantic => imageCategories.has(semantic.detectedCategory ?? '')
  ).length

  if (imageFieldCount === 0) return null

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
  const dateCategories = new Set(['date', 'timestamp'])
  const hasDate = Array.from(context.semantics.values()).some(
    semantic => dateCategories.has(semantic.detectedCategory ?? '')
  )

  // Check for title OR description field (event-like semantics)
  const narrativeCategories = new Set(['title', 'description'])
  const hasNarrative = Array.from(context.semantics.values()).some(
    semantic => narrativeCategories.has(semantic.detectedCategory ?? '')
  )

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
  for (const [name] of fields) {
    // Find importance entry by field name suffix
    const importanceEntry = Array.from(context.importance.entries()).find(([path]) =>
      path.endsWith(`].${name}`)
    )
    const tier = importanceEntry?.[1]?.tier

    if (tier === 'primary' || tier === 'secondary') {
      visibleFieldCount++
    }
  }

  // Check for rich content types from semantics
  const richCategories = new Set(['description', 'reviews', 'image', 'title'])
  const hasRichContent = Array.from(context.semantics.values()).some(
    semantic => richCategories.has(semantic.detectedCategory ?? '')
  )

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
