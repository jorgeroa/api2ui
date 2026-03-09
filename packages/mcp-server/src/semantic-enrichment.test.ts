import { describe, it, expect } from 'vitest'
import { describeFieldsFromData } from './semantic-enrichment'

describe('describeFieldsFromData', () => {
  it('detects semantic fields from response data', () => {
    const data = [
      {
        id: 1,
        name: 'Widget',
        price: 29.99,
        email: 'contact@example.com',
        created_at: '2025-01-15T10:00:00Z',
      },
    ]
    const result = describeFieldsFromData(data, 'https://api.example.com/products')

    expect(result).not.toBeNull()
    expect(result).toContain('Returns:')
  })

  it('returns null for empty data', () => {
    expect(describeFieldsFromData([], 'https://example.com')).toBeNull()
  })

  it('returns null for primitive data', () => {
    expect(describeFieldsFromData('hello', 'https://example.com')).toBeNull()
  })

  it('returns null for null data', () => {
    expect(describeFieldsFromData(null, 'https://example.com')).toBeNull()
  })

  it('caps field descriptions at 8 fields', () => {
    const item: Record<string, unknown> = {}
    // Create many semantic fields
    const fields = [
      'name', 'email', 'phone', 'price', 'rating',
      'url', 'date', 'color', 'address', 'status',
      'image_url', 'description',
    ]
    for (const f of fields) {
      item[f] = f === 'price' ? 29.99
        : f === 'rating' ? 4.5
        : f === 'email' ? 'test@example.com'
        : f === 'url' ? 'https://example.com'
        : f === 'phone' ? '+1-555-0123'
        : `sample ${f}`
    }

    const result = describeFieldsFromData([item], 'https://api.example.com/items')
    if (result) {
      // Should not have more than 8 comma-separated entries before "and N more"
      const fields = result.replace('Returns: ', '').split(', ')
      // Either 8 or fewer fields, or ends with "and N more"
      expect(fields.length).toBeLessThanOrEqual(9) // 8 fields + possible "and N more"
    }
  })
})
