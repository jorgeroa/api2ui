/**
 * Comprehensive tests for selection heuristics.
 * Covers all pattern detection functions and edge cases.
 */

import { describe, it, expect } from 'vitest'
import type { TypeSignature, SemanticMetadata } from '@/types/schema'
import type { ImportanceScore } from '@/services/analysis/types'
import {
  checkReviewPattern,
  checkImageGalleryPattern,
  checkTimelinePattern,
  selectCardOrTable,
  checkProfilePattern,
  checkComplexObjectPattern,
  checkSplitPattern,
  checkChipsPattern,
} from './heuristics'
import { selectComponent, selectObjectComponent, selectPrimitiveArrayComponent } from './index'
import type { SelectionContext } from './types'

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Create mock array-of-objects schema
 */
function createMockSchema(
  fields: Array<{ name: string; type: string }>
): TypeSignature {
  const fieldMap = new Map<string, TypeSignature>()
  for (const field of fields) {
    fieldMap.set(field.name, {
      kind: 'primitive',
      type: field.type as 'string' | 'number' | 'boolean',
    })
  }

  return {
    kind: 'array',
    items: {
      kind: 'object',
      fields: fieldMap,
    },
  }
}

/**
 * Create mock selection context
 */
function createMockContext(
  semantics: Array<{
    path: string
    category: string
    confidence: number
  }> = [],
  importance: Array<{
    path: string
    tier: 'primary' | 'secondary' | 'tertiary'
    score: number
  }> = []
): SelectionContext {
  const semanticsMap = new Map<string, SemanticMetadata>()
  for (const sem of semantics) {
    semanticsMap.set(sem.path, {
      detectedCategory: sem.category,
      confidence: sem.confidence,
      level: sem.confidence >= 0.75 ? 'high' : 'medium',
      appliedAt: 'smart-default',
      alternatives: [],
    })
  }

  const importanceMap = new Map<string, ImportanceScore>()
  for (const imp of importance) {
    importanceMap.set(imp.path, {
      tier: imp.tier,
      score: imp.score,
      signals: [],
    })
  }

  return {
    semantics: semanticsMap,
    importance: importanceMap,
  }
}

// ============================================================================
// Review Pattern Detection Tests
// ============================================================================

describe('checkReviewPattern', () => {
  it('returns card-list when rating + comment fields present', () => {
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'comment', type: 'string' },
      { name: 'author', type: 'string' },
    ])

    const context = createMockContext(
      [{ path: '$[].rating', category: 'rating', confidence: 0.9 }],
      [
        { path: '$[].comment', tier: 'primary', score: 0.85 },
        { path: '$[].author', tier: 'secondary', score: 0.6 },
      ]
    )

    const result = checkReviewPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('card-list')
    expect(result?.confidence).toBe(0.85)
    expect(result?.reason).toBe('review-pattern-detected')
  })

  it('returns card-list when rating + review fields present', () => {
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'review', type: 'string' },
    ])

    const context = createMockContext(
      [{ path: '$[].rating', category: 'rating', confidence: 0.9 }],
      [{ path: '$[].review', tier: 'primary', score: 0.9 }]
    )

    const result = checkReviewPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('card-list')
    expect(result?.confidence).toBe(0.85)
  })

  it('returns card-list when rating + description (primary tier) present', () => {
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].rating', category: 'rating', confidence: 0.9 },
        { path: '$[].description', category: 'description', confidence: 0.85 },
      ],
      [{ path: '$[].description', tier: 'primary', score: 0.9 }]
    )

    const result = checkReviewPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('card-list')
  })

  it('returns card-list when rating + description (secondary tier) present', () => {
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].rating', category: 'rating', confidence: 0.9 },
        { path: '$[].description', category: 'description', confidence: 0.8 },
      ],
      [{ path: '$[].description', tier: 'secondary', score: 0.7 }]
    )

    const result = checkReviewPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('card-list')
  })

  it('returns null when only rating field (no comment)', () => {
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'author', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].rating', category: 'rating', confidence: 0.9 },
    ])

    const result = checkReviewPattern(schema, context)

    expect(result).toBeNull()
  })

  it('returns null when rating field absent', () => {
    const schema = createMockSchema([
      { name: 'comment', type: 'string' },
      { name: 'author', type: 'string' },
    ])

    const context = createMockContext([], [
      { path: '$[].comment', tier: 'primary', score: 0.85 },
    ])

    const result = checkReviewPattern(schema, context)

    expect(result).toBeNull()
  })
})

// ============================================================================
// Image Gallery Pattern Detection Tests
// ============================================================================

describe('checkImageGalleryPattern', () => {
  it('returns gallery when image fields present AND <=4 total fields', () => {
    const schema = createMockSchema([
      { name: 'image', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'caption', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].image', category: 'image', confidence: 0.9 },
    ])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('gallery')
    expect(result?.confidence).toBe(0.9)
    expect(result?.reason).toBe('image-heavy-content')
  })

  it('returns card-list when image + >4 other fields', () => {
    const schema = createMockSchema([
      { name: 'image', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'author', type: 'string' },
      { name: 'date', type: 'string' },
      { name: 'category', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].image', category: 'image', confidence: 0.9 },
    ])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('card-list')
    expect(result?.confidence).toBe(0.75)
    expect(result?.reason).toBe('images-with-other-fields')
  })

  it('returns null when no image fields', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext([])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).toBeNull()
  })

  it('handles thumbnail semantic category', () => {
    const schema = createMockSchema([
      { name: 'thumbnail', type: 'string' },
      { name: 'title', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].thumbnail', category: 'thumbnail', confidence: 0.85 },
    ])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('gallery')
  })

  it('handles avatar semantic category', () => {
    const schema = createMockSchema([
      { name: 'avatar', type: 'string' },
      { name: 'name', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].avatar', category: 'avatar', confidence: 0.85 },
    ])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('gallery')
  })

  it('gallery for array of pure image URLs (single field)', () => {
    const schema = createMockSchema([{ name: 'url', type: 'string' }])

    const context = createMockContext([
      { path: '$[].url', category: 'image', confidence: 0.9 },
    ])

    const result = checkImageGalleryPattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('gallery')
    expect(result?.confidence).toBe(0.9)
  })
})

// ============================================================================
// Timeline Pattern Detection Tests
// ============================================================================

describe('checkTimelinePattern', () => {
  it('returns timeline when date + title present', () => {
    const schema = createMockSchema([
      { name: 'date', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].date', category: 'date', confidence: 0.9 },
      { path: '$[].title', category: 'title', confidence: 0.85 },
    ])

    const result = checkTimelinePattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('timeline')
    expect(result?.confidence).toBe(0.8)
    expect(result?.reason).toBe('event-timeline-pattern')
  })

  it('returns timeline when timestamp + description present', () => {
    const schema = createMockSchema([
      { name: 'timestamp', type: 'number' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].timestamp', category: 'timestamp', confidence: 0.9 },
      {
        path: '$[].description',
        category: 'description',
        confidence: 0.85,
      },
    ])

    const result = checkTimelinePattern(schema, context)

    expect(result).not.toBeNull()
    expect(result?.componentType).toBe('timeline')
    expect(result?.confidence).toBe(0.8)
  })

  it('returns null when only date field (no title/description)', () => {
    const schema = createMockSchema([
      { name: 'date', type: 'string' },
      { name: 'value', type: 'number' },
    ])

    const context = createMockContext([
      { path: '$[].date', category: 'date', confidence: 0.9 },
    ])

    const result = checkTimelinePattern(schema, context)

    expect(result).toBeNull()
  })

  it('returns null when only title (no date)', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].title', category: 'title', confidence: 0.85 },
    ])

    const result = checkTimelinePattern(schema, context)

    expect(result).toBeNull()
  })

  it('confidence is 0.8 for event pattern', () => {
    const schema = createMockSchema([
      { name: 'date', type: 'string' },
      { name: 'event', type: 'string' },
    ])

    const context = createMockContext([
      { path: '$[].date', category: 'date', confidence: 0.9 },
      { path: '$[].event', category: 'title', confidence: 0.8 },
    ])

    const result = checkTimelinePattern(schema, context)

    expect(result?.confidence).toBe(0.8)
  })
})

// ============================================================================
// Card vs Table Heuristic Tests
// ============================================================================

describe('selectCardOrTable', () => {
  it('returns card-list for <=8 visible fields with rich content', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'image', type: 'string' },
      { name: 'author', type: 'string' },
      { name: 'date', type: 'string' },
      { name: 'id', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].title', category: 'title', confidence: 0.9 },
        { path: '$[].description', category: 'description', confidence: 0.85 },
        { path: '$[].image', category: 'image', confidence: 0.9 },
      ],
      [
        { path: '$[].title', tier: 'primary', score: 0.9 },
        { path: '$[].description', tier: 'primary', score: 0.85 },
        { path: '$[].image', tier: 'primary', score: 0.9 },
        { path: '$[].author', tier: 'secondary', score: 0.7 },
        { path: '$[].date', tier: 'secondary', score: 0.65 },
        { path: '$[].id', tier: 'tertiary', score: 0.3 },
      ]
    )

    const result = selectCardOrTable(schema, context)

    expect(result.componentType).toBe('card-list')
    expect(result.confidence).toBe(0.75)
    expect(result.reason).toBe('rich-content-low-field-count')
  })

  it('returns table for >=10 visible fields', () => {
    const fields = Array.from({ length: 12 }, (_, i) => ({
      name: `field${i}`,
      type: 'string',
    }))
    const schema = createMockSchema(fields)

    const importance = fields.map((f) => ({
      path: `$[].${f.name}`,
      tier: 'primary' as const,
      score: 0.8,
    }))

    const context = createMockContext([], importance)

    const result = selectCardOrTable(schema, context)

    expect(result.componentType).toBe('table')
    expect(result.confidence).toBe(0.8)
    expect(result.reason).toBe('high-field-count')
  })

  it('returns table with 0.5 for ambiguous (8-10 fields, no rich content)', () => {
    const fields = Array.from({ length: 9 }, (_, i) => ({
      name: `field${i}`,
      type: 'string',
    }))
    const schema = createMockSchema(fields)

    const importance = fields.map((f) => ({
      path: `$[].${f.name}`,
      tier: 'secondary' as const,
      score: 0.6,
    }))

    const context = createMockContext([], importance)

    const result = selectCardOrTable(schema, context)

    expect(result.componentType).toBe('table')
    expect(result.confidence).toBe(0.5)
    expect(result.reason).toBe('ambiguous-default-table')
  })

  it('rich content detection includes description, reviews, image, title', () => {
    const schema = createMockSchema([
      { name: 'review', type: 'string' },
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'string' },
    ])

    const context = createMockContext(
      [{ path: '$[].review', category: 'reviews', confidence: 0.9 }],
      [
        { path: '$[].review', tier: 'primary', score: 0.9 },
        { path: '$[].field1', tier: 'secondary', score: 0.6 },
        { path: '$[].field2', tier: 'secondary', score: 0.6 },
      ]
    )

    const result = selectCardOrTable(schema, context)

    expect(result.componentType).toBe('card-list')
    expect(result.reason).toBe('rich-content-low-field-count')
  })

  it('counts only primary + secondary tier fields (ignores tertiary)', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'id', type: 'string' },
      { name: 'created_at', type: 'string' },
      { name: 'updated_at', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].title', category: 'title', confidence: 0.9 },
        { path: '$[].description', category: 'description', confidence: 0.85 },
      ],
      [
        { path: '$[].title', tier: 'primary', score: 0.9 },
        { path: '$[].description', tier: 'primary', score: 0.85 },
        { path: '$[].id', tier: 'tertiary', score: 0.3 },
        { path: '$[].created_at', tier: 'tertiary', score: 0.25 },
        { path: '$[].updated_at', tier: 'tertiary', score: 0.2 },
      ]
    )

    const result = selectCardOrTable(schema, context)

    // Only 2 visible fields (both primary), has rich content
    expect(result.componentType).toBe('card-list')
  })

  it('content richness trumps field count (12 fields but 8 tertiary = cards)', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'image', type: 'string' },
      { name: 'author', type: 'string' },
      ...Array.from({ length: 8 }, (_, i) => ({
        name: `meta${i}`,
        type: 'string',
      })),
    ])

    const context = createMockContext(
      [
        { path: '$[].title', category: 'title', confidence: 0.9 },
        { path: '$[].description', category: 'description', confidence: 0.85 },
        { path: '$[].image', category: 'image', confidence: 0.9 },
      ],
      [
        { path: '$[].title', tier: 'primary', score: 0.9 },
        { path: '$[].description', tier: 'primary', score: 0.85 },
        { path: '$[].image', tier: 'primary', score: 0.9 },
        { path: '$[].author', tier: 'secondary', score: 0.6 },
        ...Array.from({ length: 8 }, (_, i) => ({
          path: `$[].meta${i}`,
          tier: 'tertiary' as const,
          score: 0.3,
        })),
      ]
    )

    const result = selectCardOrTable(schema, context)

    // Only 4 visible fields (3 primary + 1 secondary), rich content
    expect(result.componentType).toBe('card-list')
  })

  it('table confidence is 0.8 for high field count', () => {
    const fields = Array.from({ length: 10 }, (_, i) => ({
      name: `field${i}`,
      type: 'string',
    }))
    const schema = createMockSchema(fields)

    const importance = fields.map((f) => ({
      path: `$[].${f.name}`,
      tier: 'primary' as const,
      score: 0.8,
    }))

    const context = createMockContext([], importance)

    const result = selectCardOrTable(schema, context)

    expect(result.confidence).toBe(0.8)
  })

  it('card confidence is 0.75 for rich content', () => {
    const schema = createMockSchema([
      { name: 'title', type: 'string' },
      { name: 'image', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].title', category: 'title', confidence: 0.9 },
        { path: '$[].image', category: 'image', confidence: 0.9 },
      ],
      [
        { path: '$[].title', tier: 'primary', score: 0.9 },
        { path: '$[].image', tier: 'primary', score: 0.9 },
      ]
    )

    const result = selectCardOrTable(schema, context)

    expect(result.confidence).toBe(0.75)
  })
})

// ============================================================================
// selectComponent Integration Tests
// ============================================================================

describe('selectComponent', () => {
  it('priority order: review > gallery > timeline > card-vs-table', () => {
    // Schema with both review pattern AND image pattern
    const schema = createMockSchema([
      { name: 'rating', type: 'number' },
      { name: 'comment', type: 'string' },
      { name: 'image', type: 'string' },
    ])

    const context = createMockContext(
      [
        { path: '$[].rating', category: 'rating', confidence: 0.9 },
        { path: '$[].image', category: 'image', confidence: 0.9 },
      ],
      [{ path: '$[].comment', tier: 'primary', score: 0.85 }]
    )

    const result = selectComponent(schema, context)

    // Review pattern should win (higher priority)
    expect(result.componentType).toBe('card-list')
    expect(result.reason).toBe('review-pattern-detected')
  })

  it('falls back to type-based default for non-array schemas', () => {
    const schema: TypeSignature = {
      kind: 'object',
      fields: new Map([['name', { kind: 'primitive', type: 'string' }]]),
    }

    const context = createMockContext()

    const result = selectComponent(schema, context)

    expect(result.componentType).toBe('detail')
    expect(result.confidence).toBe(0)
    expect(result.reason).toBe('not-applicable')
  })

  it('falls back to table with confidence 0 when no heuristic matches at 0.75', () => {
    const schema = createMockSchema([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'string' },
    ])

    const context = createMockContext([], [
      { path: '$[].field1', tier: 'secondary', score: 0.6 },
      { path: '$[].field2', tier: 'secondary', score: 0.6 },
    ])

    const result = selectComponent(schema, context)

    // selectCardOrTable returns 0.5 confidence (ambiguous case)
    // But that's <0.75, so we skip it and fall back
    expect(result.componentType).toBe('table')
    expect(result.confidence).toBe(0)
    expect(result.reason).toBe('fallback-to-default')
  })

  it('returns primitive-list for array of primitives', () => {
    const schema: TypeSignature = {
      kind: 'array',
      items: { kind: 'primitive', type: 'string' },
    }

    const context = createMockContext()

    const result = selectComponent(schema, context)

    expect(result.componentType).toBe('primitive-list')
    expect(result.confidence).toBe(0)
  })

  it('returns detail for object schema', () => {
    const schema: TypeSignature = {
      kind: 'object',
      fields: new Map([['name', { kind: 'primitive', type: 'string' }]]),
    }

    const context = createMockContext()

    const result = selectComponent(schema, context)

    expect(result.componentType).toBe('detail')
  })

  it('returns primitive for primitive schema', () => {
    const schema: TypeSignature = {
      kind: 'primitive',
      type: 'string',
    }

    const context = createMockContext()

    const result = selectComponent(schema, context)

    expect(result.componentType).toBe('primitive')
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('edge cases', () => {
  it('empty field list returns table fallback', () => {
    const schema = createMockSchema([])

    const context = createMockContext()

    const result = selectCardOrTable(schema, context)

    expect(result.componentType).toBe('table')
    expect(result.confidence).toBe(0.5)
  })

  it('schema with missing items property handled gracefully', () => {
    const schema: TypeSignature = {
      kind: 'array',
      items: { kind: 'primitive', type: 'string' },
    }

    const context = createMockContext()

    const result = checkReviewPattern(schema, context)

    expect(result).toBeNull()
  })

  it('context with empty maps handled gracefully', () => {
    const schema = createMockSchema([
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'string' },
    ])

    const context: SelectionContext = {
      semantics: new Map(),
      importance: new Map(),
    }

    // Should not throw, should handle missing metadata
    const reviewResult = checkReviewPattern(schema, context)
    const imageResult = checkImageGalleryPattern(schema, context)
    const timelineResult = checkTimelinePattern(schema, context)
    const cardTableResult = selectCardOrTable(schema, context)

    expect(reviewResult).toBeNull()
    expect(imageResult).toBeNull()
    expect(timelineResult).toBeNull()
    expect(cardTableResult.componentType).toBe('table')
  })
})

// ============================================================================
// Object Heuristics (Phase 14.1)
// ============================================================================

/**
 * Create mock object schema for testing object heuristics
 */
function createMockObjectSchema(
  fields: Array<{ name: string; type: TypeSignature }>
): TypeSignature {
  const fieldMap = new Map<string, any>()
  for (const field of fields) {
    fieldMap.set(field.name, {
      name: field.name,
      type: field.type,
      optional: false,
      nullable: false,
      confidence: 'high' as const,
      sampleValues: [],
    })
  }
  return { kind: 'object', fields: fieldMap }
}

/**
 * Create mock primitive array schema for testing primitive array heuristics
 */
function createMockPrimitiveArraySchema(primitiveType: string): TypeSignature {
  return {
    kind: 'array',
    items: {
      kind: 'primitive',
      type: primitiveType as 'string' | 'number' | 'boolean',
    },
  }
}

describe('Object Heuristics', () => {
  describe('checkProfilePattern', () => {
    it('returns hero when name + 2+ contact fields present', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'phone', type: { kind: 'primitive', type: 'string' } },
        { name: 'bio', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([
        { path: '$.name', category: 'name', confidence: 0.9 },
        { path: '$.email', category: 'email', confidence: 0.9 },
        { path: '$.phone', category: 'phone', confidence: 0.85 },
      ])

      const result = checkProfilePattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('hero')
      expect(result?.confidence).toBe(0.85)
      expect(result?.reason).toBe('profile-pattern-detected')
    })

    it('returns hero when name + 3 contact fields (email, address, url)', () => {
      const schema = createMockObjectSchema([
        { name: 'full_name', type: { kind: 'primitive', type: 'string' } },
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'address', type: { kind: 'primitive', type: 'string' } },
        { name: 'website', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([
        { path: '$.email', category: 'email', confidence: 0.9 },
        { path: '$.address', category: 'address', confidence: 0.85 },
        { path: '$.website', category: 'url', confidence: 0.8 },
      ])

      const result = checkProfilePattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('hero')
      expect(result?.confidence).toBe(0.85)
    })

    it('returns null when name + only 1 contact field (below threshold)', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'bio', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([
        { path: '$.name', category: 'name', confidence: 0.9 },
        { path: '$.email', category: 'email', confidence: 0.9 },
      ])

      const result = checkProfilePattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null when no name field', () => {
      const schema = createMockObjectSchema([
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'phone', type: { kind: 'primitive', type: 'string' } },
        { name: 'address', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([
        { path: '$.email', category: 'email', confidence: 0.9 },
        { path: '$.phone', category: 'phone', confidence: 0.85 },
        { path: '$.address', category: 'address', confidence: 0.85 },
      ])

      const result = checkProfilePattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null for non-object schema', () => {
      const schema: TypeSignature = {
        kind: 'array',
        items: { kind: 'primitive', type: 'string' },
      }

      const context = createMockContext()

      const result = checkProfilePattern(schema, context)

      expect(result).toBeNull()
    })

    it('detects name field from field name regex when no semantic', () => {
      const schema = createMockObjectSchema([
        { name: 'title', type: { kind: 'primitive', type: 'string' } },
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'phone', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([
        { path: '$.email', category: 'email', confidence: 0.9 },
        { path: '$.phone', category: 'phone', confidence: 0.85 },
      ])

      const result = checkProfilePattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('hero')
    })
  })

  describe('checkComplexObjectPattern', () => {
    it('returns tabs when 3+ nested object/array fields', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        {
          name: 'orders',
          type: {
            kind: 'array',
            items: { kind: 'primitive', type: 'string' },
          },
        },
        {
          name: 'profile',
          type: { kind: 'object', fields: new Map() },
        },
        {
          name: 'preferences',
          type: { kind: 'object', fields: new Map() },
        },
      ])

      const context = createMockContext()

      const result = checkComplexObjectPattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('tabs')
      expect(result?.confidence).toBe(0.8)
      expect(result?.reason).toBe('complex-nested-structure')
    })

    it('returns null when only 2 nested fields (below threshold)', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        {
          name: 'orders',
          type: {
            kind: 'array',
            items: { kind: 'primitive', type: 'string' },
          },
        },
        {
          name: 'profile',
          type: { kind: 'object', fields: new Map() },
        },
      ])

      const context = createMockContext()

      const result = checkComplexObjectPattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null for non-object schema', () => {
      const schema: TypeSignature = {
        kind: 'primitive',
        type: 'string',
      }

      const context = createMockContext()

      const result = checkComplexObjectPattern(schema, context)

      expect(result).toBeNull()
    })

    it('counts mixed nested types (objects and arrays)', () => {
      const schema = createMockObjectSchema([
        {
          name: 'metadata',
          type: { kind: 'object', fields: new Map() },
        },
        {
          name: 'tags',
          type: {
            kind: 'array',
            items: { kind: 'primitive', type: 'string' },
          },
        },
        {
          name: 'related',
          type: {
            kind: 'array',
            items: { kind: 'object', fields: new Map() },
          },
        },
      ])

      const context = createMockContext()

      const result = checkComplexObjectPattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('tabs')
    })
  })

  describe('checkSplitPattern', () => {
    it('returns split when 1 primary content + 3+ metadata fields + 5+ total', () => {
      const schema = createMockObjectSchema([
        { name: 'description', type: { kind: 'primitive', type: 'string' } },
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'created_at', type: { kind: 'primitive', type: 'string' } },
        { name: 'updated_at', type: { kind: 'primitive', type: 'string' } },
        { name: '_version', type: { kind: 'primitive', type: 'number' } },
      ])

      const context = createMockContext(
        [{ path: '$.description', category: 'description', confidence: 0.9 }],
        [
          { path: '$.description', tier: 'primary', score: 0.85 },
          { path: '$.name', tier: 'secondary', score: 0.7 },
          { path: '$.id', tier: 'tertiary', score: 0.3 },
          { path: '$.created_at', tier: 'tertiary', score: 0.25 },
          { path: '$.updated_at', tier: 'tertiary', score: 0.2 },
          { path: '$._version', tier: 'tertiary', score: 0.15 },
        ]
      )

      const result = checkSplitPattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('split')
      expect(result?.confidence).toBe(0.75)
      expect(result?.reason).toBe('content-metadata-split-detected')
    })

    it('detects content field from name regex (body, summary, text)', () => {
      const schema = createMockObjectSchema([
        { name: 'body', type: { kind: 'primitive', type: 'string' } },
        { name: 'title', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'timestamp', type: { kind: 'primitive', type: 'number' } },
        { name: 'created', type: { kind: 'primitive', type: 'string' } },
        { name: 'updated', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([], [
        { path: '$.body', tier: 'primary', score: 0.9 },
        { path: '$.title', tier: 'secondary', score: 0.7 },
        { path: '$.id', tier: 'tertiary', score: 0.3 },
        { path: '$.timestamp', tier: 'tertiary', score: 0.25 },
        { path: '$.created', tier: 'tertiary', score: 0.2 },
        { path: '$.updated', tier: 'tertiary', score: 0.15 },
      ])

      const result = checkSplitPattern(schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('split')
    })

    it('returns null when no primary content field', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'value', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'created_at', type: { kind: 'primitive', type: 'string' } },
        { name: 'updated_at', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext([], [
        { path: '$.name', tier: 'secondary', score: 0.7 },
        { path: '$.value', tier: 'secondary', score: 0.65 },
        { path: '$.id', tier: 'tertiary', score: 0.3 },
        { path: '$.created_at', tier: 'tertiary', score: 0.25 },
        { path: '$.updated_at', tier: 'tertiary', score: 0.2 },
      ])

      const result = checkSplitPattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null when <3 metadata fields', () => {
      const schema = createMockObjectSchema([
        { name: 'description', type: { kind: 'primitive', type: 'string' } },
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'created_at', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext(
        [{ path: '$.description', category: 'description', confidence: 0.9 }],
        [
          { path: '$.description', tier: 'primary', score: 0.85 },
          { path: '$.name', tier: 'secondary', score: 0.7 },
          { path: '$.id', tier: 'tertiary', score: 0.3 },
          { path: '$.created_at', tier: 'tertiary', score: 0.25 },
        ]
      )

      const result = checkSplitPattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null when <5 total fields', () => {
      const schema = createMockObjectSchema([
        { name: 'description', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'created', type: { kind: 'primitive', type: 'string' } },
        { name: 'updated', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext(
        [{ path: '$.description', category: 'description', confidence: 0.9 }],
        [
          { path: '$.description', tier: 'primary', score: 0.85 },
          { path: '$.id', tier: 'tertiary', score: 0.3 },
          { path: '$.created', tier: 'tertiary', score: 0.25 },
          { path: '$.updated', tier: 'tertiary', score: 0.2 },
        ]
      )

      const result = checkSplitPattern(schema, context)

      expect(result).toBeNull()
    })

    it('returns null for non-object schema', () => {
      const schema: TypeSignature = {
        kind: 'array',
        items: { kind: 'primitive', type: 'string' },
      }

      const context = createMockContext()

      const result = checkSplitPattern(schema, context)

      expect(result).toBeNull()
    })
  })

  describe('selectObjectComponent', () => {
    it('profile pattern wins over tabs when both match', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'email', type: { kind: 'primitive', type: 'string' } },
        { name: 'phone', type: { kind: 'primitive', type: 'string' } },
        {
          name: 'orders',
          type: {
            kind: 'array',
            items: { kind: 'primitive', type: 'string' },
          },
        },
        {
          name: 'profile',
          type: { kind: 'object', fields: new Map() },
        },
        {
          name: 'preferences',
          type: { kind: 'object', fields: new Map() },
        },
      ])

      const context = createMockContext([
        { path: '$.name', category: 'name', confidence: 0.9 },
        { path: '$.email', category: 'email', confidence: 0.9 },
        { path: '$.phone', category: 'phone', confidence: 0.85 },
      ])

      const result = selectObjectComponent(schema, context)

      // Profile should win (higher priority)
      expect(result.componentType).toBe('hero')
      expect(result.reason).toBe('profile-pattern-detected')
    })

    it('returns tabs when complex pattern matches', () => {
      const schema = createMockObjectSchema([
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        {
          name: 'orders',
          type: {
            kind: 'array',
            items: { kind: 'primitive', type: 'string' },
          },
        },
        {
          name: 'profile',
          type: { kind: 'object', fields: new Map() },
        },
        {
          name: 'preferences',
          type: { kind: 'object', fields: new Map() },
        },
      ])

      const context = createMockContext()

      const result = selectObjectComponent(schema, context)

      expect(result.componentType).toBe('tabs')
      expect(result.reason).toBe('complex-nested-structure')
    })

    it('returns split when split pattern matches', () => {
      const schema = createMockObjectSchema([
        { name: 'description', type: { kind: 'primitive', type: 'string' } },
        { name: 'name', type: { kind: 'primitive', type: 'string' } },
        { name: 'id', type: { kind: 'primitive', type: 'string' } },
        { name: 'created_at', type: { kind: 'primitive', type: 'string' } },
        { name: 'updated_at', type: { kind: 'primitive', type: 'string' } },
        { name: '_version', type: { kind: 'primitive', type: 'number' } },
      ])

      const context = createMockContext(
        [{ path: '$.description', category: 'description', confidence: 0.9 }],
        [
          { path: '$.description', tier: 'primary', score: 0.85 },
          { path: '$.name', tier: 'secondary', score: 0.7 },
          { path: '$.id', tier: 'tertiary', score: 0.3 },
          { path: '$.created_at', tier: 'tertiary', score: 0.25 },
          { path: '$.updated_at', tier: 'tertiary', score: 0.2 },
          { path: '$._version', tier: 'tertiary', score: 0.15 },
        ]
      )

      const result = selectObjectComponent(schema, context)

      expect(result.componentType).toBe('split')
      expect(result.reason).toBe('content-metadata-split-detected')
    })

    it('returns detail fallback when no pattern matches', () => {
      const schema = createMockObjectSchema([
        { name: 'field1', type: { kind: 'primitive', type: 'string' } },
        { name: 'field2', type: { kind: 'primitive', type: 'string' } },
      ])

      const context = createMockContext()

      const result = selectObjectComponent(schema, context)

      expect(result.componentType).toBe('detail')
      expect(result.confidence).toBe(0)
      expect(result.reason).toBe('fallback-to-default')
    })

    it('returns detail fallback for non-object schema', () => {
      const schema: TypeSignature = {
        kind: 'array',
        items: { kind: 'primitive', type: 'string' },
      }

      const context = createMockContext()

      const result = selectObjectComponent(schema, context)

      expect(result.componentType).toBe('detail')
      expect(result.confidence).toBe(0)
      expect(result.reason).toBe('fallback-to-default')
    })
  })
})

// ============================================================================
// Primitive Array Heuristics (Phase 14.1)
// ============================================================================

describe('Primitive Array Heuristics', () => {
  describe('checkChipsPattern', () => {
    it('returns chips with 0.9 confidence for semantic tags category', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = ['react', 'typescript', 'nextjs']

      const context = createMockContext([
        { path: '$.tags', category: 'tags', confidence: 0.9 },
      ])

      const result = checkChipsPattern(data, schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('chips')
      expect(result?.confidence).toBe(0.9)
      expect(result?.reason).toBe('semantic-tags-or-status')
    })

    it('returns chips with 0.9 confidence for semantic status category', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = ['active', 'pending', 'completed']

      const context = createMockContext([
        { path: '$.statuses', category: 'status', confidence: 0.85 },
      ])

      const result = checkChipsPattern(data, schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('chips')
      expect(result?.confidence).toBe(0.9)
      expect(result?.reason).toBe('semantic-tags-or-status')
    })

    it('returns chips with 0.8 confidence for short enum-like values', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = ['Small', 'Medium', 'Large', 'XL']

      const context = createMockContext()

      const result = checkChipsPattern(data, schema, context)

      expect(result).not.toBeNull()
      expect(result?.componentType).toBe('chips')
      expect(result?.confidence).toBe(0.8)
      expect(result?.reason).toBe('short-enum-like-values')
    })

    it('returns null for long values (avg >20 or max >30)', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = [
        'This is a very long description that exceeds the maximum length',
        'Another long description',
      ]

      const context = createMockContext()

      const result = checkChipsPattern(data, schema, context)

      expect(result).toBeNull()
    })

    it('returns null for non-string primitive arrays', () => {
      const schema = createMockPrimitiveArraySchema('number')
      const data = [1, 2, 3, 4, 5]

      const context = createMockContext()

      const result = checkChipsPattern(data, schema, context)

      expect(result).toBeNull()
    })

    it('returns null for empty data', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data: string[] = []

      const context = createMockContext()

      const result = checkChipsPattern(data, schema, context)

      expect(result).toBeNull()
    })

    it('returns null when array length >10', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = Array(11).fill('tag')

      const context = createMockContext()

      const result = checkChipsPattern(data, schema, context)

      expect(result).toBeNull()
    })
  })

  describe('selectPrimitiveArrayComponent', () => {
    it('returns chips when chips pattern matches', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = ['react', 'vue', 'angular']

      const context = createMockContext([
        { path: '$.frameworks', category: 'tags', confidence: 0.9 },
      ])

      const result = selectPrimitiveArrayComponent(schema, data, context)

      expect(result.componentType).toBe('chips')
      expect(result.confidence).toBe(0.9)
      expect(result.reason).toBe('semantic-tags-or-status')
    })

    it('returns primitive-list fallback when chips pattern fails', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data = [
        'This is a very long description that exceeds thirty characters',
        'Another long item',
      ]

      const context = createMockContext()

      const result = selectPrimitiveArrayComponent(schema, data, context)

      expect(result.componentType).toBe('primitive-list')
      expect(result.confidence).toBe(0)
      expect(result.reason).toBe('fallback-to-default')
    })

    it('returns primitive-list with no-data reason when data is empty', () => {
      const schema = createMockPrimitiveArraySchema('string')
      const data: string[] = []

      const context = createMockContext()

      const result = selectPrimitiveArrayComponent(schema, data, context)

      expect(result.componentType).toBe('primitive-list')
      expect(result.confidence).toBe(0)
      expect(result.reason).toBe('no-data')
    })

    it('returns primitive-list fallback for non-primitive-array schema', () => {
      const schema: TypeSignature = {
        kind: 'array',
        items: { kind: 'object', fields: new Map() },
      }
      const data: unknown[] = []

      const context = createMockContext()

      const result = selectPrimitiveArrayComponent(schema, data, context)

      expect(result.componentType).toBe('primitive-list')
      expect(result.confidence).toBe(0)
      expect(result.reason).toBe('fallback-to-default')
    })
  })
})
