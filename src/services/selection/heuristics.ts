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
 * Helper to extract field entries from object schema.
 * Returns array of [fieldName, FieldDefinition] tuples.
 */
function getObjectFields(schema: TypeSignature): Array<[string, import('@/types/schema').FieldDefinition]> | null {
  if (schema.kind !== 'object') return null
  return Array.from(schema.fields.entries())
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

/**
 * Detects profile/person pattern: name field + 2+ contact fields.
 * User decision: Hero component for user profiles and contact cards.
 *
 * Contact categories: email, phone, address, url
 *
 * @returns hero with 0.85 confidence when name + 2+ contacts
 * @returns null when below threshold or non-object schema
 */
export function checkProfilePattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getObjectFields(schema)
  if (!fields) return null

  // Check for name field via semantic category or field name regex
  const hasName = fields.some(([fieldName, fieldDef]) => {
    // Check semantic category
    const semanticPath = `$.${fieldName}`
    const semantic = context.semantics.get(semanticPath)
    if (semantic?.detectedCategory === 'name') return true

    // Fallback to field name regex
    return /^(name|title|full_?name)$/i.test(fieldName)
  })

  if (!hasName) return null

  // Count contact fields
  const contactCategories = new Set(['email', 'phone', 'address', 'url'])
  let contactCount = 0

  for (const [fieldName] of fields) {
    const semanticPath = `$.${fieldName}`
    const semantic = context.semantics.get(semanticPath)
    if (semantic && contactCategories.has(semantic.detectedCategory ?? '')) {
      contactCount++
    }
  }

  // Need 2+ contact fields for profile pattern
  if (contactCount >= 2) {
    return {
      componentType: 'hero',
      confidence: 0.85,
      reason: 'profile-pattern-detected',
    }
  }

  return null
}

/**
 * Detects complex nested objects with 3+ nested structures.
 * User decision: Tabs component for organizing nested content.
 *
 * @returns tabs with 0.8 confidence when 3+ nested object/array fields
 * @returns null when below threshold or non-object schema
 */
export function checkComplexObjectPattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getObjectFields(schema)
  if (!fields) return null

  // Count fields whose type is object or array
  let nestedCount = 0

  for (const [, fieldDef] of fields) {
    const fieldType = fieldDef.type
    if (fieldType.kind === 'object' || fieldType.kind === 'array') {
      nestedCount++
    }
  }

  // Need 3+ nested structures for tabs
  if (nestedCount >= 3) {
    return {
      componentType: 'tabs',
      confidence: 0.8,
      reason: 'complex-nested-structure',
    }
  }

  return null
}

/**
 * Detects content + metadata split pattern.
 * User decision: Split component for content-heavy objects with metadata.
 *
 * Requirements:
 * - Exactly 1 primary-tier content field (description semantic OR name matches content regex)
 * - 3+ metadata fields (tertiary tier OR name matches metadata regex)
 * - 5+ total fields
 *
 * @returns split with 0.75 confidence when pattern matches
 * @returns null otherwise
 */
export function checkSplitPattern(
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  const fields = getObjectFields(schema)
  if (!fields) return null

  // Need 5+ total fields
  if (fields.length < 5) return null

  const contentNameRegex = /^(description|content|body|summary|text)$/i
  const metadataNameRegex = /^(id|created|updated|timestamp|_)/

  let primaryContentCount = 0
  let metadataCount = 0

  for (const [fieldName, fieldDef] of fields) {
    const semanticPath = `$.${fieldName}`
    const semantic = context.semantics.get(semanticPath)
    const importance = context.importance.get(semanticPath)

    // Check for primary content field
    const isDescriptionSemantic = semantic?.detectedCategory === 'description'
    const isContentName = contentNameRegex.test(fieldName)
    const isPrimaryTier = importance?.tier === 'primary'

    if (isPrimaryTier && (isDescriptionSemantic || isContentName)) {
      primaryContentCount++
    }

    // Check for metadata field
    const isTertiaryTier = importance?.tier === 'tertiary'
    const isMetadataName = metadataNameRegex.test(fieldName)

    if (isTertiaryTier || isMetadataName) {
      metadataCount++
    }
  }

  // Need exactly 1 primary content field and 3+ metadata fields
  if (primaryContentCount === 1 && metadataCount >= 3) {
    return {
      componentType: 'split',
      confidence: 0.75,
      reason: 'content-metadata-split-detected',
    }
  }

  return null
}

/**
 * Detects chips pattern for primitive string arrays.
 * User decision: Chips component for tags, statuses, and short enum-like values.
 *
 * Heuristics:
 * 1. Semantic category 'tags' or 'status' → 0.9 confidence
 * 2. String values with avg length <=20, max <=30, array length <=10 → 0.8 confidence
 *
 * @param data - The actual array data (needed for value length analysis)
 * @param schema - Type signature (must be array of primitive strings)
 * @param context - Selection context with semantic metadata
 * @returns chips with 0.8-0.9 confidence when pattern matches, null otherwise
 */
export function checkChipsPattern(
  data: unknown,
  schema: TypeSignature,
  context: SelectionContext
): ComponentSelection | null {
  // Must be array of primitive strings
  if (schema.kind !== 'array') return null
  if (schema.items.kind !== 'primitive') return null
  if (schema.items.type !== 'string') return null

  // Check for semantic tags or status category
  // Iterate over all semantics since path varies (could be $.tags, $.statuses, etc.)
  const hasTagsOrStatus = Array.from(context.semantics.values()).some(
    semantic => semantic.detectedCategory === 'tags' || semantic.detectedCategory === 'status'
  )

  if (hasTagsOrStatus) {
    return {
      componentType: 'chips',
      confidence: 0.9,
      reason: 'semantic-tags-or-status',
    }
  }

  // Check value-based heuristics
  if (!Array.isArray(data) || data.length === 0) return null
  if (data.length > 10) return null

  // Calculate string length statistics
  let totalLength = 0
  let maxLength = 0

  for (const item of data) {
    if (typeof item !== 'string') return null
    totalLength += item.length
    maxLength = Math.max(maxLength, item.length)
  }

  const avgLength = totalLength / data.length

  // Short enum-like values: avg <=20, max <=30
  if (avgLength <= 20 && maxLength <= 30) {
    return {
      componentType: 'chips',
      confidence: 0.8,
      reason: 'short-enum-like-values',
    }
  }

  return null
}
