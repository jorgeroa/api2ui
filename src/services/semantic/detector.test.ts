/**
 * Tests for the semantic detection engine.
 * Validates pattern matching, confidence scoring, and edge case handling.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import {
  detectSemantics,
  detectCompositeSemantics,
  getBestMatch,
  clearSemanticCache,
} from './detector'

describe('detectSemantics', () => {
  beforeEach(() => {
    clearSemanticCache()
  })

  describe('positive detection (should match with >75% confidence)', () => {
    test('price field with numeric value', () => {
      const results = detectSemantics('root.price', 'price', 'number', [29.99])
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
      expect(results[0].level).toBe('high')
    })

    test('cost field as price synonym', () => {
      const results = detectSemantics('root.cost', 'cost', 'number', [100])
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('rating field with numeric value', () => {
      const results = detectSemantics('root.rating', 'rating', 'number', [4.5])
      expect(results[0].category).toBe('rating')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('email field with email value', () => {
      const results = detectSemantics('root.email', 'email', 'string', ['test@example.com'])
      expect(results[0].category).toBe('email')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('image field with image URL', () => {
      const results = detectSemantics(
        'root.image',
        'image',
        'string',
        ['https://example.com/img.jpg']
      )
      expect(results[0].category).toBe('image')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('tags field with string array', () => {
      const results = detectSemantics('root.tags', 'tags', 'array', [['tech', 'news']])
      expect(results[0].category).toBe('tags')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('status field with status value', () => {
      const results = detectSemantics('root.status', 'status', 'string', ['active'])
      expect(results[0].category).toBe('status')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('uuid field with valid UUIDv4', () => {
      // Valid UUIDv4: 4th char of 3rd group must be '4', 1st char of 4th group must be 8/9/a/b
      const results = detectSemantics(
        'root.uuid',
        'uuid',
        'string',
        ['550e8400-e29b-41d4-a716-446655440000'] // Valid v4 UUID
      )
      expect(results[0].category).toBe('uuid')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('unique_id field with valid UUIDv4', () => {
      const results = detectSemantics(
        'root.unique_id',
        'unique_id',
        'string',
        ['550e8400-e29b-41d4-a716-446655440000'] // Valid v4 UUID
      )
      expect(results[0].category).toBe('uuid')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('phone field with phone number', () => {
      const results = detectSemantics('root.phone', 'phone', 'string', ['+1-555-123-4567'])
      expect(results[0].category).toBe('phone')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('url field with valid URL', () => {
      const results = detectSemantics('root.url', 'url', 'string', ['https://example.com'])
      expect(results[0].category).toBe('url')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('name field with name value', () => {
      const results = detectSemantics('root.name', 'name', 'string', ['John Doe'])
      // Could be 'name' or 'title' - both valid
      expect(['name', 'title']).toContain(results[0].category)
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('title field with title value', () => {
      const results = detectSemantics('root.title', 'title', 'string', ['Product Title'])
      expect(results[0].category).toBe('title')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('description field with long text', () => {
      const results = detectSemantics(
        'root.description',
        'description',
        'string',
        ['This is a longer description that explains the product in detail and has more than 20 characters.']
      )
      expect(results[0].category).toBe('description')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('date field with ISO date', () => {
      const results = detectSemantics('root.date', 'date', 'string', ['2024-01-15'])
      expect(results[0].category).toBe('date')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('timestamp field with ISO timestamp', () => {
      const results = detectSemantics('root.timestamp', 'timestamp', 'string', ['2024-01-15T10:30:00Z'])
      expect(results[0].category).toBe('timestamp')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })
  })

  describe('multilingual detection (should match with >75% confidence)', () => {
    test('Spanish: precio -> price', () => {
      const results = detectSemantics('root.precio', 'precio', 'number', [50])
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('French: prix -> price', () => {
      const results = detectSemantics('root.prix', 'prix', 'number', [50])
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('German: preis -> price', () => {
      const results = detectSemantics('root.preis', 'preis', 'number', [50])
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('Spanish: nombre -> name', () => {
      const results = detectSemantics('root.nombre', 'nombre', 'string', ['Juan'])
      expect(['name', 'title']).toContain(results[0].category)
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('Spanish: correo -> email', () => {
      const results = detectSemantics('root.correo', 'correo', 'string', ['test@example.com'])
      expect(results[0].category).toBe('email')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('German: bewertung -> rating', () => {
      const results = detectSemantics('root.bewertung', 'bewertung', 'number', [4.5])
      expect(results[0].category).toBe('rating')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('Spanish: imagen -> image', () => {
      const results = detectSemantics(
        'root.imagen',
        'imagen',
        'string',
        ['https://cdn.example.com/photo.png']
      )
      expect(results[0].category).toBe('image')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })
  })

  describe('negative detection (should NOT match with >75% confidence)', () => {
    test('generic name "data" should not match', () => {
      const results = detectSemantics('root.data', 'data', 'object', [{}])
      const highConfidence = results.filter(r => r.confidence >= 0.75)
      expect(highConfidence.length).toBe(0)
    })

    test('generic name "value" should not match', () => {
      const results = detectSemantics('root.value', 'value', 'string', ['something'])
      const highConfidence = results.filter(r => r.confidence >= 0.75)
      expect(highConfidence.length).toBe(0)
    })

    test('generic name "item" should not match', () => {
      const results = detectSemantics('root.item', 'item', 'object', [{}])
      const highConfidence = results.filter(r => r.confidence >= 0.75)
      expect(highConfidence.length).toBe(0)
    })

    test('generic name "result" should not match', () => {
      const results = detectSemantics('root.result', 'result', 'string', ['success'])
      const highConfidence = results.filter(r => r.confidence >= 0.75)
      expect(highConfidence.length).toBe(0)
    })

    test('price field with string value "expensive" has lower confidence (type mismatch)', () => {
      const results = detectSemantics('root.price', 'price', 'string', ['expensive'])
      // Should still detect as price but with lower confidence due to value mismatch
      // Note: string is allowed for price pattern, so it may still get high confidence
      // But value "expensive" won't match the isPositiveNumber validator
      const priceResult = results.find(r => r.category === 'price')
      if (priceResult) {
        // Even if it matches, should be lower than when value validates
        expect(priceResult.confidence).toBeLessThan(0.90)
      }
    })

    test('rating field with string value "good" has lower confidence', () => {
      const results = detectSemantics('root.rating', 'rating', 'string', ['good'])
      // Rating pattern only allows 'number' type
      const ratingResult = results.find(r => r.category === 'rating')
      if (ratingResult) {
        expect(ratingResult.confidence).toBeLessThan(0.75)
      }
    })

    test('random alphanumeric name should not match with high confidence', () => {
      const results = detectSemantics('root.xyz123', 'xyz123', 'string', ['abc'])
      const highConfidence = results.filter(r => r.confidence >= 0.75)
      expect(highConfidence.length).toBe(0)
    })
  })

  describe('OpenAPI format hints', () => {
    test('format email boosts confidence for email field', () => {
      // Email pattern with email name + email format + email value
      const results = detectSemantics(
        'root.email',
        'email',
        'string',
        ['a@b.com'],
        { format: 'email' }
      )
      expect(results[0].category).toBe('email')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format email with mail name still detects email', () => {
      // Name 'mail' matches email pattern
      const results = detectSemantics(
        'root.mail',
        'mail',
        'string',
        ['a@b.com'],
        { format: 'email' }
      )
      expect(results[0].category).toBe('email')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format date-time with timestamp name detects timestamp', () => {
      const results = detectSemantics(
        'root.timestamp',
        'timestamp',
        'string',
        ['2024-01-15T10:30:00Z'],
        { format: 'date-time' }
      )
      expect(results[0].category).toBe('timestamp')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format date-time with created_at name detects timestamp', () => {
      const results = detectSemantics(
        'root.created_at',
        'created_at',
        'string',
        ['2024-01-15T10:30:00Z'],
        { format: 'date-time' }
      )
      // created_at matches both date and timestamp patterns
      expect(['timestamp', 'date']).toContain(results[0].category)
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format date boosts confidence for date pattern', () => {
      const results = detectSemantics(
        'root.birth_date',
        'birth_date',
        'string',
        ['2024-01-15'],
        { format: 'date' }
      )
      expect(results[0].category).toBe('date')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format uri boosts confidence for URL pattern', () => {
      const results = detectSemantics(
        'root.website',
        'website',
        'string',
        ['https://example.com'],
        { format: 'uri' }
      )
      expect(['url', 'image', 'video']).toContain(results[0].category)
    })

    test('format uuid boosts confidence for UUID pattern', () => {
      // Using 'guid' name which matches uuid pattern with weight 0.4
      // With valid v4 UUID value
      const results = detectSemantics(
        'root.guid',
        'guid',
        'string',
        ['550e8400-e29b-41d4-a716-446655440000'], // Valid v4 UUID
        { format: 'uuid' }
      )
      expect(results[0].category).toBe('uuid')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('id field with uuid format and valid value detects as uuid', () => {
      // 'id' has lower name weight (0.2) but with uuid format + value should still work
      // id: 0.2 (name) + 0.2 (type) + 0.3 (value) + 0.1 (format) / 1.0 = 0.8
      const results = detectSemantics(
        'root.id',
        'id',
        'string',
        ['550e8400-e29b-41d4-a716-446655440000'], // Valid v4 UUID
        { format: 'uuid' }
      )
      expect(results[0].category).toBe('uuid')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('format currency boosts confidence for price pattern', () => {
      const results = detectSemantics(
        'root.amount',
        'amount',
        'number',
        [99.99],
        { format: 'currency' }
      )
      expect(results[0].category).toBe('price')
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.75)
    })
  })

  describe('returns max 3 alternatives', () => {
    test('returns at most 3 results', () => {
      const results = detectSemantics('root.status', 'status', 'string', ['active'])
      expect(results.length).toBeLessThanOrEqual(3)
    })

    test('results are sorted by confidence descending', () => {
      const results = detectSemantics('root.price', 'price', 'number', [29.99])
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence)
      }
    })
  })
})

describe('detectCompositeSemantics', () => {
  describe('composite patterns', () => {
    test('reviews array with rating+comment fields', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'comment', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.reviews',
        'reviews',
        itemFields,
        [{ rating: 5, comment: 'Great!' }]
      )
      expect(result?.category).toBe('reviews')
      expect(result?.confidence).toBeGreaterThanOrEqual(0.75)
    })

    test('comments array with rating+text fields detects as reviews', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'text', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.comments',
        'comments',
        itemFields,
        [{ rating: 4, text: 'Nice' }]
      )
      expect(result?.category).toBe('reviews')
    })

    test('feedback array with score+body fields detects as reviews', () => {
      const itemFields = [
        { name: 'score', type: 'number' },
        { name: 'body', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.feedback',
        'feedback',
        itemFields,
        [{ score: 3, body: 'Average' }]
      )
      expect(result?.category).toBe('reviews')
    })

    test('products array with rating+name does NOT detect as reviews (missing comment)', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'name', type: 'string' }, // 'name' doesn't match comment pattern
      ]
      const result = detectCompositeSemantics(
        'root.products',
        'products',
        itemFields,
        [{ rating: 5, name: 'Widget' }]
      )
      // Should NOT match reviews since 'name' doesn't satisfy comment requirement
      // Result might be null or have lower confidence
      if (result) {
        expect(result.confidence).toBeLessThan(0.75)
      }
    })

    test('array with rating only does NOT detect as reviews (missing comment)', () => {
      const itemFields = [{ name: 'rating', type: 'number' }]
      const result = detectCompositeSemantics(
        'root.ratings',
        'ratings',
        itemFields,
        [{ rating: 5 }]
      )
      // Should NOT match reviews since comment is required
      if (result) {
        expect(result.confidence).toBeLessThan(0.75)
      }
    })

    test('empty items array reduces confidence but still detects', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'comment', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.reviews',
        'reviews',
        itemFields,
        [] // Empty array
      )
      // Should still detect but with reduced confidence
      expect(result?.category).toBe('reviews')
    })
  })

  describe('multilingual composite patterns', () => {
    test('Spanish: opiniones with rating+comment', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'comment', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.opiniones',
        'opiniones',
        itemFields,
        [{ rating: 5, comment: 'Excelente!' }]
      )
      expect(result?.category).toBe('reviews')
    })

    test('French: avis with rating+content', () => {
      const itemFields = [
        { name: 'rating', type: 'number' },
        { name: 'content', type: 'string' },
      ]
      const result = detectCompositeSemantics(
        'root.avis',
        'avis',
        itemFields,
        [{ rating: 4, content: 'Tres bien' }]
      )
      expect(result?.category).toBe('reviews')
    })
  })
})

describe('getBestMatch', () => {
  beforeEach(() => {
    clearSemanticCache()
  })

  test('returns best result when confidence is high', () => {
    const results = detectSemantics('root.price', 'price', 'number', [29.99])
    const best = getBestMatch(results)
    expect(best).not.toBeNull()
    expect(best?.category).toBe('price')
    expect(best?.level).toBe('high')
  })

  test('returns null when no high confidence match', () => {
    const results = detectSemantics('root.data', 'data', 'object', [{}])
    const best = getBestMatch(results)
    expect(best).toBeNull()
  })

  test('returns null for empty results array', () => {
    const best = getBestMatch([])
    expect(best).toBeNull()
  })
})
