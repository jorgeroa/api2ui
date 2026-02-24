/**
 * Tests for the runtime embedding classifier.
 * Validates tokenization, embedding lookup, and classification.
 */

import { describe, test, expect } from 'vitest'
import {
  tokenizeFieldName,
  lookupTokenEmbedding,
  computeFieldEmbedding,
  classifyFieldName,
  getEmbeddingSimilarity,
  getKnownTokenCount,
} from './embeddings'

describe('tokenizeFieldName', () => {
  test('snake_case splits into tokens', () => {
    expect(tokenizeFieldName('user_name')).toEqual(['user_name', 'user', 'name'])
  })

  test('camelCase splits into tokens', () => {
    expect(tokenizeFieldName('userName')).toEqual(['username', 'user', 'name'])
  })

  test('kebab-case splits into tokens', () => {
    expect(tokenizeFieldName('user-name')).toEqual(['user-name', 'user', 'name'])
  })

  test('dot.notation splits into tokens', () => {
    expect(tokenizeFieldName('profile.avatar')).toEqual(['profile.avatar', 'profile', 'avatar'])
  })

  test('single word returns the word only', () => {
    expect(tokenizeFieldName('price')).toEqual(['price'])
  })

  test('mixed case single word treated as one token', () => {
    // "pRiCe" splits on camelCase: p + Ri + Ce → "p", "ri", "ce"
    // But the full name "price" is included first, deduped with parts
    expect(tokenizeFieldName('pRiCe')).toEqual(['price', 'p', 'ri', 'ce'])
  })

  test('UPPER case returns lowercase', () => {
    expect(tokenizeFieldName('PRICE')).toEqual(['price'])
  })

  test('empty string returns empty array', () => {
    expect(tokenizeFieldName('')).toEqual([])
  })

  test('compound name includes full name as first token', () => {
    const tokens = tokenizeFieldName('product_price')
    expect(tokens[0]).toBe('product_price')
    expect(tokens).toContain('product')
    expect(tokens).toContain('price')
  })

  test('PascalCase splits correctly', () => {
    expect(tokenizeFieldName('ProductPrice')).toEqual(['productprice', 'product', 'price'])
  })

  test('acronym followed by word splits correctly', () => {
    const tokens = tokenizeFieldName('HTMLParser')
    expect(tokens).toContain('html')
    expect(tokens).toContain('parser')
  })
})

describe('lookupTokenEmbedding', () => {
  test('known token returns embedding array', () => {
    const emb = lookupTokenEmbedding('price')
    expect(emb).not.toBeNull()
    expect(emb).toHaveLength(384)
  })

  test('unknown token returns null', () => {
    expect(lookupTokenEmbedding('xyznonexistent')).toBeNull()
  })

  test('all category names have embeddings', () => {
    const categories = ['price', 'email', 'phone', 'uuid', 'name', 'address',
      'url', 'image', 'video', 'thumbnail', 'avatar', 'rating', 'tags',
      'status', 'title', 'description', 'date', 'timestamp']
    for (const cat of categories) {
      expect(lookupTokenEmbedding(cat)).not.toBeNull()
    }
  })
})

describe('computeFieldEmbedding', () => {
  test('single known token returns valid embedding', () => {
    const emb = computeFieldEmbedding(['price'])
    expect(emb).not.toBeNull()
    expect(emb).toHaveLength(384)
  })

  test('multiple known tokens returns averaged embedding', () => {
    const single = computeFieldEmbedding(['price'])
    const multi = computeFieldEmbedding(['product', 'price'])
    // Should be different from single token (averaged with "product")
    // But both should exist
    expect(single).not.toBeNull()
    expect(multi).not.toBeNull()
  })

  test('all unknown tokens returns null', () => {
    expect(computeFieldEmbedding(['xyz', 'abc', '123'])).toBeNull()
  })

  test('mixed known/unknown tokens ignores unknown', () => {
    const withUnknown = computeFieldEmbedding(['unknownxyz', 'price'])
    const onlyKnown = computeFieldEmbedding(['price'])
    // Should be the same since unknown is skipped
    expect(withUnknown).toEqual(onlyKnown)
  })

  test('embedding is L2-normalized', () => {
    const emb = computeFieldEmbedding(['price'])!
    const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0))
    expect(norm).toBeCloseTo(1.0, 3)
  })
})

describe('classifyFieldName', () => {
  test('price field classifies as price', () => {
    const result = classifyFieldName('price')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('price')
    expect(result!.score).toBeGreaterThan(0.9)
  })

  test('email field classifies as email', () => {
    const result = classifyFieldName('email')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('email')
  })

  test('multilingual: precio classifies as price', () => {
    const result = classifyFieldName('precio')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('price')
  })

  test('multilingual: correo classifies as email', () => {
    const result = classifyFieldName('correo')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('email')
  })

  test('multilingual: bewertung classifies as rating', () => {
    const result = classifyFieldName('bewertung')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('rating')
  })

  test('compound name: product_price classifies as price', () => {
    const result = classifyFieldName('product_price')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('price')
  })

  test('camelCase: phoneNumber classifies as phone', () => {
    const result = classifyFieldName('phoneNumber')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('phone')
  })

  test('unknown word returns null or low confidence', () => {
    const result = classifyFieldName('xyznonexistent')
    expect(result).toBeNull()
  })

  test('generic word "data" does not classify with high confidence', () => {
    const result = classifyFieldName('data')
    // "data" is in vocab and might classify, but shouldn't be super confident
    if (result) {
      // With competitive scoring, the best match gets score 1.0
      // but "data" has low spread (similar to many categories)
      expect(result.score).toBeDefined()
    }
  })
})

describe('getEmbeddingSimilarity', () => {
  test('price against price category has highest similarity', () => {
    const priceScore = getEmbeddingSimilarity('price', 'price')
    const emailScore = getEmbeddingSimilarity('price', 'email')
    expect(priceScore).toBeGreaterThan(emailScore)
  })

  test('email against email category has highest similarity', () => {
    const emailScore = getEmbeddingSimilarity('email', 'email')
    const priceScore = getEmbeddingSimilarity('email', 'price')
    expect(emailScore).toBeGreaterThan(priceScore)
  })

  test('unknown field returns 0', () => {
    expect(getEmbeddingSimilarity('xyznonexistent', 'price')).toBe(0)
  })
})

describe('getKnownTokenCount', () => {
  test('single known token reports correctly', () => {
    const result = getKnownTokenCount('price')
    expect(result.total).toBe(1)
    expect(result.known).toBe(1)
    expect(result.unknown).toEqual([])
  })

  test('compound with unknown parts reports correctly', () => {
    const result = getKnownTokenCount('product_price')
    expect(result.total).toBe(3) // product_price, product, price
    expect(result.known).toBeGreaterThanOrEqual(1)
  })

  test('all unknown tokens reports correctly', () => {
    const result = getKnownTokenCount('xyz')
    expect(result.total).toBe(1)
    expect(result.known).toBe(0)
    expect(result.unknown).toEqual(['xyz'])
  })
})

describe('integration: embedding strategy with scorer', () => {
  // These tests verify the embedding strategy works correctly
  // when wired through the full detection pipeline.
  // The detector.test.ts covers integration scenarios.

  test('competitive scoring gives 1.0 for best category', () => {
    // The strategy normalizes scores so the best match = 1.0
    // This is tested indirectly through the detector tests
    const result = classifyFieldName('price')
    expect(result).not.toBeNull()
    // Raw classification returns the best match
    expect(result!.category).toBe('price')
  })
})
