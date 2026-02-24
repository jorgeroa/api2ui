/**
 * Comprehensive tests for importance scoring algorithm.
 * Tests all signals, tier assignment, and metadata override behavior.
 */

import { describe, it, expect } from 'vitest'
import { calculateImportance, isMetadataField } from './importance'
import { IMPORTANCE_CONFIG } from './config'
import type { FieldInfo } from './types'

/**
 * Helper to create test FieldInfo with defaults.
 */
function createFieldInfo(overrides: Partial<FieldInfo>): FieldInfo {
  return {
    path: 'test.field',
    name: 'field',
    semanticCategory: null,
    sampleValues: [],
    position: 0,
    totalFields: 1,
    ...overrides,
  }
}

describe('calculateImportance', () => {
  describe('Name Pattern Signal', () => {
    it('should give high contribution for "title" field', () => {
      const field = createFieldInfo({ name: 'title', totalFields: 10 })
      const result = calculateImportance(field)

      const nameSignal = result.signals.find(s => s.name === 'namePattern')
      expect(nameSignal).toBeDefined()
      expect(nameSignal?.matched).toBe(true)
      expect(nameSignal?.contribution).toBe(IMPORTANCE_CONFIG.weights.namePattern)
    })

    it('should give high contribution for "name" field', () => {
      const field = createFieldInfo({ name: 'name', totalFields: 10 })
      const result = calculateImportance(field)

      const nameSignal = result.signals.find(s => s.name === 'namePattern')
      expect(nameSignal?.matched).toBe(true)
      expect(nameSignal?.contribution).toBe(IMPORTANCE_CONFIG.weights.namePattern)
    })

    it('should give high contribution for "headline" field', () => {
      const field = createFieldInfo({ name: 'headline', totalFields: 10 })
      const result = calculateImportance(field)

      const nameSignal = result.signals.find(s => s.name === 'namePattern')
      expect(nameSignal?.matched).toBe(true)
      expect(nameSignal?.contribution).toBe(IMPORTANCE_CONFIG.weights.namePattern)
    })

    it('should give zero contribution for random field name', () => {
      const field = createFieldInfo({ name: 'foo', totalFields: 10 })
      const result = calculateImportance(field)

      const nameSignal = result.signals.find(s => s.name === 'namePattern')
      expect(nameSignal?.matched).toBe(false)
      expect(nameSignal?.contribution).toBe(0)
    })

    it('should be case insensitive (Title, NAME)', () => {
      const field1 = createFieldInfo({ name: 'Title', totalFields: 10 })
      const result1 = calculateImportance(field1)
      expect(result1.signals.find(s => s.name === 'namePattern')?.matched).toBe(true)

      const field2 = createFieldInfo({ name: 'NAME', totalFields: 10 })
      const result2 = calculateImportance(field2)
      expect(result2.signals.find(s => s.name === 'namePattern')?.matched).toBe(true)
    })

    it('should match word boundaries (product_title matches)', () => {
      const field = createFieldInfo({ name: 'product_title', totalFields: 10 })
      const result = calculateImportance(field)

      const nameSignal = result.signals.find(s => s.name === 'namePattern')
      expect(nameSignal?.matched).toBe(true)
    })
  })

  describe('Visual Richness Signal', () => {
    it('should return 1.0 richness for image category', () => {
      const field = createFieldInfo({
        name: 'photo',
        semanticCategory: 'image',
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(1.0 * IMPORTANCE_CONFIG.weights.visualRichness)
    })

    it('should return 1.0 richness for avatar category', () => {
      const field = createFieldInfo({
        name: 'avatar',
        semanticCategory: 'avatar',
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(1.0 * IMPORTANCE_CONFIG.weights.visualRichness)
    })

    it('should return 1.0 richness for video category', () => {
      const field = createFieldInfo({
        name: 'video_url',
        semanticCategory: 'video',
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(1.0 * IMPORTANCE_CONFIG.weights.visualRichness)
    })

    it('should return 0.6 richness for title category', () => {
      const field = createFieldInfo({
        name: 'title',
        semanticCategory: 'title',
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(0.6 * IMPORTANCE_CONFIG.weights.visualRichness)
    })

    it('should return 0.2 richness for uuid category', () => {
      const field = createFieldInfo({
        name: 'uuid',
        semanticCategory: 'uuid',
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(0.2 * IMPORTANCE_CONFIG.weights.visualRichness)
    })

    it('should return 0.4 default for null category', () => {
      const field = createFieldInfo({
        name: 'random',
        semanticCategory: null,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const visualSignal = result.signals.find(s => s.name === 'visualRichness')
      expect(visualSignal?.contribution).toBe(0.4 * IMPORTANCE_CONFIG.weights.visualRichness)
    })
  })

  describe('Data Presence Signal', () => {
    it('should return 1.0 for all non-null values', () => {
      const field = createFieldInfo({
        name: 'active',
        sampleValues: ['value1', 'value2', 'value3'],
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const presenceSignal = result.signals.find(s => s.name === 'dataPresence')
      expect(presenceSignal?.contribution).toBe(1.0 * IMPORTANCE_CONFIG.weights.dataPresence)
    })

    it('should return 0.5 for half null values', () => {
      const field = createFieldInfo({
        name: 'optional',
        sampleValues: ['value1', null, 'value2', null],
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const presenceSignal = result.signals.find(s => s.name === 'dataPresence')
      expect(presenceSignal?.contribution).toBe(0.5 * IMPORTANCE_CONFIG.weights.dataPresence)
    })

    it('should return 0.0 for all null/empty values', () => {
      const field = createFieldInfo({
        name: 'missing',
        sampleValues: [null, undefined, ''],
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const presenceSignal = result.signals.find(s => s.name === 'dataPresence')
      expect(presenceSignal?.contribution).toBe(0)
    })

    it('should return 0.0 for empty sampleValues array', () => {
      const field = createFieldInfo({
        name: 'empty',
        sampleValues: [],
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const presenceSignal = result.signals.find(s => s.name === 'dataPresence')
      expect(presenceSignal?.contribution).toBe(0)
    })
  })

  describe('Position Signal', () => {
    it('should return high score (~1.0) for position 0 of 10', () => {
      const field = createFieldInfo({
        name: 'first',
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const positionSignal = result.signals.find(s => s.name === 'position')
      // Position 0 should get close to 1.0 (multiplied by weight 0.15)
      const expectedContribution = IMPORTANCE_CONFIG.weights.position
      expect(positionSignal?.contribution).toBeGreaterThan(0.14)
      expect(positionSignal?.contribution).toBeLessThanOrEqual(expectedContribution)
    })

    it('should return medium score (~0.7-0.8) for position 5 of 10', () => {
      const field = createFieldInfo({
        name: 'middle',
        position: 5,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const positionSignal = result.signals.find(s => s.name === 'position')
      // Position 5/10 should get ~0.7-0.8 base score
      const baseScore = positionSignal!.contribution / IMPORTANCE_CONFIG.weights.position
      expect(baseScore).toBeGreaterThan(0.6)
      expect(baseScore).toBeLessThan(0.9)
    })

    it('should return lower score for position 9 of 10', () => {
      const field = createFieldInfo({
        name: 'last',
        position: 9,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      const positionSignal = result.signals.find(s => s.name === 'position')
      // Position 9/10 should get lower score than position 0
      const baseScore = positionSignal!.contribution / IMPORTANCE_CONFIG.weights.position
      expect(baseScore).toBeLessThan(0.7)
      expect(baseScore).toBeGreaterThanOrEqual(0.2) // Minimum is 0.2
    })

    it('should return 1.0 for single field (position 0, total 1)', () => {
      const field = createFieldInfo({
        name: 'only',
        position: 0,
        totalFields: 1,
      })
      const result = calculateImportance(field)

      const positionSignal = result.signals.find(s => s.name === 'position')
      expect(positionSignal?.contribution).toBe(IMPORTANCE_CONFIG.weights.position)
    })
  })

  describe('Tier Assignment', () => {
    it('should return primary tier for score >= 0.80', () => {
      // Create field with high name pattern + image + full data + early position
      const field = createFieldInfo({
        name: 'title',
        semanticCategory: 'image',
        sampleValues: ['val1', 'val2', 'val3'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('primary')
      expect(result.score).toBeGreaterThanOrEqual(IMPORTANCE_CONFIG.tierThresholds.primary)
    })

    it('should return secondary tier for score 0.50-0.79', () => {
      // Create field with moderate signals: no name match, high visual, full data, mid position
      const field = createFieldInfo({
        name: 'field_abc',  // No primary indicator match (0%)
        semanticCategory: 'image',  // High richness 1.0 (1.0 * 25% = 25%)
        sampleValues: ['val1', 'val2'],  // Full data (20%)
        position: 4,  // Mid position (~7-8%)
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('secondary')
      expect(result.score).toBeGreaterThanOrEqual(IMPORTANCE_CONFIG.tierThresholds.secondary)
      expect(result.score).toBeLessThan(IMPORTANCE_CONFIG.tierThresholds.primary)
    })

    it('should return tertiary tier for score < 0.50', () => {
      // Create field with low signals
      const field = createFieldInfo({
        name: 'random_field',
        semanticCategory: null,
        sampleValues: [null, null],
        position: 9,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
      expect(result.score).toBeLessThan(IMPORTANCE_CONFIG.tierThresholds.secondary)
    })

    it('should calculate primary tier from combined high signals', () => {
      const field = createFieldInfo({
        name: 'product_name',
        semanticCategory: 'name',
        sampleValues: ['Product A', 'Product B', 'Product C'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      // Should have:
      // - Name pattern: 0.40 (matches 'name')
      // - Visual richness: 0.6 * 0.25 = 0.15 (name category)
      // - Data presence: 1.0 * 0.20 = 0.20 (all non-null)
      // - Position: ~1.0 * 0.15 = 0.15 (position 0)
      // Total: 0.40 + 0.15 + 0.20 + 0.15 = 0.90 (primary)
      expect(result.tier).toBe('primary')
      expect(result.score).toBeGreaterThanOrEqual(0.80)
    })
  })

  describe('Metadata Override (CRITICAL)', () => {
    it('should force "id" field to tertiary even with high score', () => {
      const field = createFieldInfo({
        name: 'id',
        semanticCategory: 'uuid',
        sampleValues: ['abc123', 'def456', 'ghi789'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
      // Score may be high, but tier is forced to tertiary
    })

    it('should force "_internal" field to tertiary', () => {
      const field = createFieldInfo({
        name: '_internal',
        semanticCategory: null,
        sampleValues: ['val1', 'val2'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })

    it('should force "user_id" (foreign key) to tertiary', () => {
      const field = createFieldInfo({
        name: 'user_id',
        semanticCategory: 'uuid',
        sampleValues: ['123', '456', '789'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })

    it('should force "created_at" to tertiary', () => {
      const field = createFieldInfo({
        name: 'created_at',
        semanticCategory: 'timestamp',
        sampleValues: ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })

    it('should force "updated_at" to tertiary', () => {
      const field = createFieldInfo({
        name: 'updated_at',
        semanticCategory: 'timestamp',
        sampleValues: ['2024-01-01T00:00:00Z'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })

    it('should NOT force "title" to tertiary (not metadata)', () => {
      const field = createFieldInfo({
        name: 'title',
        semanticCategory: 'title',
        sampleValues: ['Title 1', 'Title 2'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).not.toBe('tertiary')
    })

    it('should force "product_id" to tertiary', () => {
      const field = createFieldInfo({
        name: 'product_id',
        semanticCategory: null,
        sampleValues: ['p1', 'p2'],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })

    it('should force "deleted_at" to tertiary', () => {
      const field = createFieldInfo({
        name: 'deleted_at',
        semanticCategory: 'timestamp',
        sampleValues: [null, null],
        position: 0,
        totalFields: 10,
      })
      const result = calculateImportance(field)

      expect(result.tier).toBe('tertiary')
    })
  })

  describe('Integration Tests', () => {
    it('should score typical product object correctly', () => {
      const fields = [
        createFieldInfo({
          path: 'product.id',
          name: 'id',
          semanticCategory: 'uuid',
          sampleValues: ['p1', 'p2'],
          position: 0,
          totalFields: 5,
        }),
        createFieldInfo({
          path: 'product.title',
          name: 'title',
          semanticCategory: 'title',
          sampleValues: ['Product A', 'Product B'],
          position: 1,
          totalFields: 5,
        }),
        createFieldInfo({
          path: 'product.price',
          name: 'price',
          semanticCategory: 'price',
          sampleValues: [19.99, 29.99],
          position: 2,
          totalFields: 5,
        }),
        createFieldInfo({
          path: 'product.image',
          name: 'image',
          semanticCategory: 'image',
          sampleValues: ['img1.jpg', 'img2.jpg'],
          position: 3,
          totalFields: 5,
        }),
        createFieldInfo({
          path: 'product.created_at',
          name: 'created_at',
          semanticCategory: 'timestamp',
          sampleValues: ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'],
          position: 4,
          totalFields: 5,
        }),
      ]

      const results = fields.map(f => calculateImportance(f))

      // id: forced tertiary (metadata override)
      expect(results[0].tier).toBe('tertiary')

      // title: primary (name pattern + title category + full data + early position)
      expect(results[1].tier).toBe('primary')

      // price: secondary (name matches price indicator, default richness, full data, mid position)
      // Total: 0.40 + 0.10 + 0.20 + ~0.10 = ~0.80
      expect(results[2].tier).toBe('secondary')

      // image: primary (name matches image indicator + high visual richness + full data)
      // Total: 0.40 + 0.25 + 0.20 + ~0.09 = ~0.94
      expect(results[3].tier).toBe('primary')

      // created_at: forced tertiary (metadata override)
      expect(results[4].tier).toBe('tertiary')
    })

    it('should score typical user object correctly', () => {
      const fields = [
        createFieldInfo({
          path: 'user.uuid',
          name: 'uuid',
          semanticCategory: 'uuid',
          sampleValues: ['u1', 'u2'],
          position: 0,
          totalFields: 4,
        }),
        createFieldInfo({
          path: 'user.name',
          name: 'name',
          semanticCategory: 'name',
          sampleValues: ['Alice', 'Bob'],
          position: 1,
          totalFields: 4,
        }),
        createFieldInfo({
          path: 'user.email',
          name: 'email',
          semanticCategory: 'email',
          sampleValues: ['alice@example.com', 'bob@example.com'],
          position: 2,
          totalFields: 4,
        }),
        createFieldInfo({
          path: 'user.avatar',
          name: 'avatar',
          semanticCategory: 'avatar',
          sampleValues: ['avatar1.jpg', 'avatar2.jpg'],
          position: 3,
          totalFields: 4,
        }),
      ]

      const results = fields.map(f => calculateImportance(f))

      // uuid: likely tertiary (low visual richness)
      expect(results[0].tier).toBe('tertiary')

      // name: primary (name pattern + name category + full data)
      expect(results[1].tier).toBe('primary')

      // email: secondary (name matches email indicator, default richness, full data, mid position)
      // Total: 0.40 + 0.10 + 0.20 + ~0.09 = ~0.79
      expect(results[2].tier).toBe('secondary')

      // avatar: primary (name matches image/avatar indicator + high visual richness + full data)
      // Total: 0.40 + 0.25 + 0.20 + ~0.08 = ~0.93
      expect(results[3].tier).toBe('primary')
    })

    it('should have config weights that sum to 1.0', () => {
      const sum = Object.values(IMPORTANCE_CONFIG.weights).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10) // Allow tiny floating point differences
    })
  })

  describe('isMetadataField', () => {
    const patterns = IMPORTANCE_CONFIG.metadataPatterns

    it('should detect "id" as metadata', () => {
      expect(isMetadataField('id', patterns)).toBe(true)
    })

    it('should detect "ID" as metadata (case insensitive)', () => {
      expect(isMetadataField('ID', patterns)).toBe(true)
    })

    it('should detect "_internal" as metadata', () => {
      expect(isMetadataField('_internal', patterns)).toBe(true)
    })

    it('should detect "user_id" as metadata', () => {
      expect(isMetadataField('user_id', patterns)).toBe(true)
    })

    it('should detect "created_at" as metadata', () => {
      expect(isMetadataField('created_at', patterns)).toBe(true)
    })

    it('should NOT detect "title" as metadata', () => {
      expect(isMetadataField('title', patterns)).toBe(false)
    })

    it('should NOT detect "identification" as metadata (not exact id)', () => {
      expect(isMetadataField('identification', patterns)).toBe(false)
    })

    it('should detect "deleted_date" as metadata', () => {
      expect(isMetadataField('deleted_date', patterns)).toBe(true)
    })
  })
})
