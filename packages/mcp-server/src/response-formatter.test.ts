import { describe, it, expect } from 'vitest'
import { formatResponse } from './response-formatter'

describe('formatResponse', () => {
  it('returns full JSON when fullResponse is true', () => {
    const data = { a: 1, b: [1, 2, 3] }
    const result = formatResponse(data, true)
    expect(result).toBe(JSON.stringify(data, null, 2))
  })

  it('returns plain JSON for small responses', () => {
    const data = { name: 'test', value: 42 }
    const result = formatResponse(data)
    expect(result).toBe(JSON.stringify(data, null, 2))
    expect(result).not.toContain('truncated')
  })

  it('truncates top-level arrays beyond 25 items', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ id: i }))
    const result = formatResponse(data)
    expect(result).toContain('showing 25 of 50 items')
    const parsed = JSON.parse(result.split('\n\n...')[0]!)
    expect(parsed).toHaveLength(25)
  })

  it('does not truncate arrays at or below 25 items', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({ id: i }))
    const result = formatResponse(data)
    expect(result).not.toContain('truncated')
    expect(result).not.toContain('showing')
  })

  it('truncates nested arrays beyond 10 items', () => {
    const data = { items: Array.from({ length: 20 }, (_, i) => i) }
    const result = formatResponse(data)
    const parsed = JSON.parse(result)
    expect(parsed.items).toHaveLength(11) // 10 items + "... and N more" message
    expect(parsed.items[10]).toContain('and 10 more items')
  })

  it('handles null and primitive values', () => {
    expect(formatResponse(null)).toBe('null')
    expect(formatResponse(42)).toBe('42')
    expect(formatResponse('hello')).toBe('"hello"')
  })

  it('truncates by byte size for very large responses', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      content: 'x'.repeat(5000),
    }))
    const result = formatResponse(data)
    expect(result).toContain('truncated')
    expect(result).toContain('full response is')
  })

  it('does not truncate large responses when fullResponse is true', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      content: 'x'.repeat(1000),
    }))
    const result = formatResponse(data, true)
    expect(result).not.toContain('truncated')
    const parsed = JSON.parse(result)
    expect(parsed).toHaveLength(100)
  })
})
