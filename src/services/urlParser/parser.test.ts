/**
 * Tests for URL parameter parser.
 * Covers all parsing scenarios from the plan specification.
 */

import { parseUrlParameters } from './parser'

describe('parseUrlParameters', () => {
  describe('simple key=value parsing', () => {
    it('parses single parameter', () => {
      const result = parseUrlParameters('https://example.com?foo=bar')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('foo')
      expect(result.parameters[0].schema.default).toBe('bar')
      expect(result.parameters[0].isArray).toBe(false)
      expect(result.warnings).toHaveLength(0)
    })

    it('parses multiple parameters', () => {
      const result = parseUrlParameters('https://example.com?foo=bar&baz=123')

      expect(result.parameters).toHaveLength(2)
      expect(result.parameters[0].name).toBe('foo')
      expect(result.parameters[0].schema.default).toBe('bar')
      expect(result.parameters[1].name).toBe('baz')
      expect(result.parameters[1].schema.default).toBe('123')
    })

    it('handles query string without URL', () => {
      const result = parseUrlParameters('?foo=bar')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('foo')
    })

    it('handles query string without leading ?', () => {
      const result = parseUrlParameters('foo=bar&baz=123')

      expect(result.parameters).toHaveLength(2)
      expect(result.parameters[0].name).toBe('foo')
      expect(result.parameters[1].name).toBe('baz')
    })
  })

  describe('empty values', () => {
    it('handles empty value', () => {
      const result = parseUrlParameters('?foo=')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('foo')
      expect(result.parameters[0].schema.default).toBe('')
      expect(result.parameters[0].isArray).toBe(false)
    })

    it('handles parameter with no value (key only)', () => {
      const result = parseUrlParameters('?foo')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('foo')
      expect(result.parameters[0].schema.default).toBe('')
    })
  })

  describe('bracket notation arrays', () => {
    it('parses bracket notation as array', () => {
      const result = parseUrlParameters('?tag[]=a&tag[]=b')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('tag')
      expect(result.parameters[0].originalKey).toBe('tag[]')
      expect(result.parameters[0].isArray).toBe(true)
      expect(result.parameters[0].values).toEqual(['a', 'b'])
      expect(result.parameters[0].schema.type).toBe('array')
    })

    it('handles single bracket notation parameter as array', () => {
      const result = parseUrlParameters('?tag[]=single')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('tag')
      expect(result.parameters[0].isArray).toBe(true)
      expect(result.parameters[0].values).toEqual(['single'])
    })

    it('preserves order of array values', () => {
      const result = parseUrlParameters('?items[]=first&items[]=second&items[]=third')

      expect(result.parameters[0].values).toEqual(['first', 'second', 'third'])
    })
  })

  describe('repeated key arrays', () => {
    it('treats repeated keys as array', () => {
      const result = parseUrlParameters('?tag=a&tag=b')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('tag')
      expect(result.parameters[0].isArray).toBe(true)
      expect(result.parameters[0].values).toEqual(['a', 'b'])
    })

    it('handles many repeated keys', () => {
      const result = parseUrlParameters('?id=1&id=2&id=3&id=4')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('id')
      expect(result.parameters[0].values).toEqual(['1', '2', '3', '4'])
    })
  })

  describe('mixed array notations', () => {
    it('merges bracket and non-bracket as array with warning', () => {
      const result = parseUrlParameters('?tag[]=a&tag=b')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('tag')
      expect(result.parameters[0].isArray).toBe(true)
      expect(result.parameters[0].values).toContain('a')
      expect(result.parameters[0].values).toContain('b')
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('tag')
    })
  })

  describe('group extraction', () => {
    it('extracts group from bracket prefix', () => {
      const result = parseUrlParameters('?ddcFilter[name]=foo')

      expect(result.parameters).toHaveLength(1)
      expect(result.parameters[0].name).toBe('ddcFilter[name]')
      expect(result.parameters[0].group).toBe('ddcFilter')
      expect(result.groups.get('ddcFilter')).toContain('ddcFilter[name]')
    })

    it('groups multiple parameters with same prefix', () => {
      const result = parseUrlParameters('?ddcFilter[name]=foo&ddcFilter[age]=25')

      expect(result.parameters).toHaveLength(2)
      expect(result.groups.get('ddcFilter')).toEqual(['ddcFilter[name]', 'ddcFilter[age]'])
    })

    it('handles multiple different groups', () => {
      const result = parseUrlParameters('?user[name]=Alice&user[email]=a@b.com&filter[status]=active')

      expect(result.groups.get('user')).toEqual(['user[name]', 'user[email]'])
      expect(result.groups.get('filter')).toEqual(['filter[status]'])
    })

    it('distinguishes between array notation and group notation', () => {
      // tag[] is array notation (no key inside bracket)
      // filter[name] is group notation (has key inside bracket)
      const result = parseUrlParameters('?tag[]=a&filter[name]=foo')

      expect(result.parameters).toHaveLength(2)

      const tagParam = result.parameters.find(p => p.name === 'tag')
      expect(tagParam?.isArray).toBe(true)
      expect(tagParam?.group).toBeUndefined()

      const filterParam = result.parameters.find(p => p.name === 'filter[name]')
      expect(filterParam?.group).toBe('filter')
      expect(filterParam?.isArray).toBe(false)
    })
  })

  describe('URL encoding', () => {
    it('decodes percent-encoded values', () => {
      const result = parseUrlParameters('?foo=hello%20world')

      expect(result.parameters[0].schema.default).toBe('hello world')
    })

    it('decodes percent-encoded keys', () => {
      const result = parseUrlParameters('?hello%20world=value')

      expect(result.parameters[0].name).toBe('hello world')
    })

    it('handles plus signs as spaces', () => {
      const result = parseUrlParameters('?q=hello+world')

      expect(result.parameters[0].schema.default).toBe('hello world')
    })

    it('handles complex encoding', () => {
      const result = parseUrlParameters('?data=%7B%22key%22%3A%22value%22%7D')

      expect(result.parameters[0].schema.default).toBe('{"key":"value"}')
    })

    it('warns on malformed encoding that was fixed', () => {
      // Malformed: % not followed by valid hex
      const result = parseUrlParameters('?foo=100%')

      // Should still parse, but with warning
      expect(result.parameters).toHaveLength(1)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('invalid URL handling', () => {
    it('returns empty params with warning for completely invalid input', () => {
      const result = parseUrlParameters('')

      expect(result.parameters).toHaveLength(0)
      // Empty string is valid (just no params)
      expect(result.warnings).toHaveLength(0)
    })

    it('handles URL with no query string', () => {
      const result = parseUrlParameters('https://example.com')

      expect(result.parameters).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('handles URL with empty query string', () => {
      const result = parseUrlParameters('https://example.com?')

      expect(result.parameters).toHaveLength(0)
    })
  })

  describe('duplicate non-array warnings', () => {
    it('warns about duplicate keys without bracket notation', () => {
      const result = parseUrlParameters('?foo=1&foo=2')

      // Should still treat as array
      expect(result.parameters[0].isArray).toBe(true)
      expect(result.parameters[0].values).toEqual(['1', '2'])
      // But warn about ambiguity
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('foo') && w.includes('duplicate'))).toBe(true)
    })
  })

  describe('parameter metadata', () => {
    it('sets correct in and required fields', () => {
      const result = parseUrlParameters('?foo=bar')

      expect(result.parameters[0].in).toBe('query')
      expect(result.parameters[0].required).toBe(false)
    })

    it('sets schema type to string for simple params', () => {
      const result = parseUrlParameters('?foo=bar')

      expect(result.parameters[0].schema.type).toBe('string')
    })

    it('sets schema type to array for array params', () => {
      const result = parseUrlParameters('?foo[]=a&foo[]=b')

      expect(result.parameters[0].schema.type).toBe('array')
    })

    it('stores original key', () => {
      const result = parseUrlParameters('?tag[]=value')

      expect(result.parameters[0].originalKey).toBe('tag[]')
    })

    it('sets description to empty string', () => {
      const result = parseUrlParameters('?foo=bar')

      expect(result.parameters[0].description).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles special characters in values', () => {
      const result = parseUrlParameters('?redirect=https://example.com/path?nested=true')

      // Only first = should split
      expect(result.parameters[0].name).toBe('redirect')
      expect(result.parameters[0].schema.default).toBe('https://example.com/path?nested=true')
    })

    it('handles unicode characters', () => {
      const result = parseUrlParameters('?name=%E4%B8%AD%E6%96%87')

      expect(result.parameters[0].schema.default).toBe('中文')
    })

    it('handles very long values', () => {
      const longValue = 'a'.repeat(10000)
      const result = parseUrlParameters(`?data=${longValue}`)

      expect(result.parameters[0].schema.default).toBe(longValue)
    })

    it('handles parameters with underscores and dashes', () => {
      const result = parseUrlParameters('?my_param=1&my-param=2')

      expect(result.parameters).toHaveLength(2)
      expect(result.parameters[0].name).toBe('my_param')
      expect(result.parameters[1].name).toBe('my-param')
    })
  })
})
