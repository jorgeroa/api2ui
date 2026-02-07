/**
 * Tests for the confidence scoring algorithm.
 * Validates multi-signal pattern matching and score calculation.
 */

import { describe, test, expect } from 'vitest'
import { calculateConfidence } from './scorer'
import type { SemanticPattern } from './types'

// Mock pattern for testing
const createTestPattern = (overrides: Partial<SemanticPattern> = {}): SemanticPattern => ({
  category: 'price',
  namePatterns: [
    { regex: /\bprice\b/i, weight: 0.4, languages: ['en'] },
  ],
  typeConstraint: {
    allowed: ['number', 'string'],
    weight: 0.2,
  },
  valueValidators: [
    {
      name: 'isPositiveNumber',
      validator: (value: unknown) => typeof value === 'number' && value >= 0,
      weight: 0.25,
    },
  ],
  formatHints: [
    { format: 'currency', weight: 0.15 },
  ],
  thresholds: { high: 0.75, medium: 0.50 },
  ...overrides,
})

describe('calculateConfidence', () => {
  describe('perfect match scenarios', () => {
    test('name + type + value all match yields high confidence (>= 0.90)', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // Name matches (0.4), type matches (0.2), value matches (0.25)
      // Max possible = 0.4 + 0.2 + 0.25 + 0.15 = 1.0
      // Score = 0.4 + 0.2 + 0.25 = 0.85
      // Confidence = 0.85 / 1.0 = 0.85
      expect(result.confidence).toBeGreaterThanOrEqual(0.80)
      expect(result.level).toBe('high')
      expect(result.category).toBe('price')
    })

    test('perfect match with format hint yields highest confidence', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        { format: 'currency' },
        pattern
      )

      // All signals match including format hint
      expect(result.confidence).toBeGreaterThanOrEqual(0.95)
      expect(result.level).toBe('high')
    })
  })

  describe('partial match scenarios', () => {
    test('name only matches yields lower confidence', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'boolean', // Type doesn't match
        [true],    // Value doesn't match
        undefined,
        pattern
      )

      // Only name matches: 0.4 / 1.0 = 0.40
      expect(result.confidence).toBeLessThan(0.75)
      expect(result.level).toBe('low')
    })

    test('type only matches yields lower confidence', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'data', // Name doesn't match
        'number',
        [-5], // Negative, doesn't pass isPositiveNumber
        undefined,
        pattern
      )

      // Only type matches: 0.2 / 1.0 = 0.20
      expect(result.confidence).toBeLessThan(0.50)
      expect(result.level).toBe('low')
    })

    test('value only matches yields lower confidence', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'data', // Name doesn't match
        'boolean', // Type doesn't match
        [50], // But value would match if type were right
        undefined,
        pattern
      )

      // Value still passes because 50 >= 0
      // Only value matches: 0.25 / 1.0 = 0.25
      expect(result.confidence).toBeLessThan(0.50)
    })
  })

  describe('no match scenarios', () => {
    test('no signals match yields confidence near 0, level none', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'data', // Doesn't match 'price'
        'boolean', // Not allowed
        [true], // Not a positive number
        { format: 'binary' }, // Not 'currency'
        pattern
      )

      expect(result.confidence).toBe(0)
      expect(result.level).toBe('none')
    })

    test('empty field name returns no name match', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        '',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // Name won't match, but type and value will
      expect(result.confidence).toBeLessThan(0.75)
    })
  })

  describe('weight calculation correctness', () => {
    test('weights are applied correctly to each signal', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // Find signals
      const nameSignal = result.signals.find(s => s.name.includes('namePattern'))
      const typeSignal = result.signals.find(s => s.name === 'typeConstraint')
      const valueSignal = result.signals.find(s => s.name.includes('valueValidator'))

      expect(nameSignal?.contribution).toBe(0.4)
      expect(typeSignal?.contribution).toBe(0.2)
      expect(valueSignal?.contribution).toBe(0.25)
    })

    test('best-match-wins for multiple name patterns', () => {
      const pattern = createTestPattern({
        namePatterns: [
          { regex: /\bcost\b/i, weight: 0.3, languages: ['en'] },
          { regex: /\bprice\b/i, weight: 0.4, languages: ['en'] },
          { regex: /\bprecio\b/i, weight: 0.35, languages: ['es'] },
        ],
      })

      // Test that matching 'price' uses the 0.4 weight (best match)
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      const nameSignal = result.signals.find(s => s.name.includes('namePattern'))
      expect(nameSignal?.contribution).toBe(0.4) // Best match weight
    })

    test('multilingual name pattern: matching any language works', () => {
      const pattern = createTestPattern({
        namePatterns: [
          { regex: /\b(price|precio|prix)\b/i, weight: 0.4, languages: ['en', 'es', 'fr'] },
        ],
      })

      const spanishResult = calculateConfidence(
        'precio',
        'number',
        [50],
        undefined,
        pattern
      )

      expect(spanishResult.signals.find(s => s.name.includes('namePattern'))?.matched).toBe(true)
      expect(spanishResult.signals.find(s => s.name.includes('namePattern'))?.contribution).toBe(0.4)
    })
  })

  describe('format hints', () => {
    test('formatHints boost confidence when OpenAPI format matches', () => {
      const pattern = createTestPattern()

      const withHint = calculateConfidence(
        'price',
        'number',
        [29.99],
        { format: 'currency' },
        pattern
      )

      const withoutHint = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // Format hint adds 0.15 contribution
      expect(withHint.confidence).toBeGreaterThan(withoutHint.confidence)

      const formatSignal = withHint.signals.find(s => s.name === 'formatHint:currency')
      expect(formatSignal?.matched).toBe(true)
      expect(formatSignal?.contribution).toBe(0.15)
    })

    test('non-matching format does not boost confidence', () => {
      const pattern = createTestPattern()

      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        { format: 'binary' },
        pattern
      )

      const formatSignal = result.signals.find(s => s.name === 'formatHint:currency')
      expect(formatSignal?.matched).toBe(false)
      expect(formatSignal?.contribution).toBe(0)
    })

    test('multiple format hints can match', () => {
      const pattern = createTestPattern({
        formatHints: [
          { format: 'currency', weight: 0.15 },
          { format: 'decimal', weight: 0.1 },
        ],
      })

      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        { format: 'decimal' },
        pattern
      )

      const decimalSignal = result.signals.find(s => s.name === 'formatHint:decimal')
      expect(decimalSignal?.matched).toBe(true)
      expect(decimalSignal?.contribution).toBe(0.1)
    })
  })

  describe('confidence levels', () => {
    test('confidence >= 0.75 yields "high" level', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        { format: 'currency' },
        pattern
      )

      expect(result.level).toBe('high')
    })

    test('confidence >= 0.50 but < 0.75 yields "medium" level', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'price',
        'boolean', // Type mismatch
        [29.99],
        undefined,
        pattern
      )

      // Name (0.4) + value (0.25) = 0.65
      // 0.65 / 1.0 = 0.65
      expect(result.level).toBe('medium')
    })

    test('confidence > 0 but < 0.50 yields "low" level', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'data',
        'number',
        [-5], // Negative, fails validator
        undefined,
        pattern
      )

      // Only type matches: 0.2 / 1.0 = 0.20
      expect(result.level).toBe('low')
    })

    test('confidence = 0 yields "none" level', () => {
      const pattern = createTestPattern()
      const result = calculateConfidence(
        'xyz',
        'boolean',
        [true],
        undefined,
        pattern
      )

      expect(result.level).toBe('none')
    })
  })

  describe('edge cases', () => {
    test('pattern with no name patterns still calculates confidence', () => {
      const pattern = createTestPattern({
        namePatterns: [],
      })

      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // type (0.2) + value (0.25) / (0.2 + 0.25 + 0.15) = 0.75
      expect(result.confidence).toBeGreaterThan(0)
    })

    test('pattern with no value validators still calculates confidence', () => {
      const pattern = createTestPattern({
        valueValidators: [],
      })

      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      // name (0.4) + type (0.2) / (0.4 + 0.2 + 0.15) = 0.8
      expect(result.confidence).toBeGreaterThan(0.75)
    })

    test('value validator that throws is handled gracefully', () => {
      const pattern = createTestPattern({
        valueValidators: [
          {
            name: 'throwingValidator',
            validator: () => { throw new Error('boom') },
            weight: 0.25,
          },
        ],
      })

      // Should not throw
      const result = calculateConfidence(
        'price',
        'number',
        [29.99],
        undefined,
        pattern
      )

      const validatorSignal = result.signals.find(s => s.name.includes('throwingValidator'))
      expect(validatorSignal?.matched).toBe(false)
    })

    test('empty sample values array does not crash', () => {
      const pattern = createTestPattern()

      const result = calculateConfidence(
        'price',
        'number',
        [],
        undefined,
        pattern
      )

      // Value validator won't match since no values to test
      const valueSignal = result.signals.find(s => s.name.includes('valueValidator'))
      expect(valueSignal?.matched).toBe(false)
    })
  })
})
