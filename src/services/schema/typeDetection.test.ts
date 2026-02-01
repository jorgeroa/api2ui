import { detectFieldType } from './typeDetection'

describe('detectFieldType', () => {
  describe('string detection', () => {
    it('detects non-empty string', () => {
      expect(detectFieldType('hello')).toBe('string')
    })

    it('detects empty string', () => {
      expect(detectFieldType('')).toBe('string')
    })

    it('detects numeric string as string', () => {
      expect(detectFieldType('12345')).toBe('string')
    })

    it('detects non-date string', () => {
      expect(detectFieldType('not-a-date')).toBe('string')
    })
  })

  describe('number detection', () => {
    it('detects integer', () => {
      expect(detectFieldType(42)).toBe('number')
    })

    it('detects zero', () => {
      expect(detectFieldType(0)).toBe('number')
    })

    it('detects float', () => {
      expect(detectFieldType(3.14)).toBe('number')
    })

    it('detects negative number', () => {
      expect(detectFieldType(-10)).toBe('number')
    })
  })

  describe('boolean detection', () => {
    it('detects true', () => {
      expect(detectFieldType(true)).toBe('boolean')
    })

    it('detects false', () => {
      expect(detectFieldType(false)).toBe('boolean')
    })
  })

  describe('null detection', () => {
    it('detects null', () => {
      expect(detectFieldType(null)).toBe('null')
    })

    it('detects undefined as null', () => {
      expect(detectFieldType(undefined)).toBe('null')
    })
  })

  describe('date detection', () => {
    it('detects ISO 8601 with time and Z', () => {
      expect(detectFieldType('2026-02-01T12:00:00Z')).toBe('date')
    })

    it('detects ISO 8601 with time and timezone offset', () => {
      expect(detectFieldType('2026-02-01T12:00:00+05:30')).toBe('date')
    })

    it('detects ISO 8601 with milliseconds', () => {
      expect(detectFieldType('2026-02-01T12:00:00.123Z')).toBe('date')
    })

    it('detects ISO 8601 date only', () => {
      expect(detectFieldType('2026-02-01')).toBe('date')
    })

    it('rejects invalid date format', () => {
      expect(detectFieldType('2026/02/01')).toBe('string')
    })

    it('rejects date-like but invalid string', () => {
      expect(detectFieldType('2026-13-01')).toBe('string') // month 13 invalid
    })
  })

  describe('edge cases', () => {
    it('does not handle arrays', () => {
      // Arrays should be handled by inferrer, not type detection
      // This function focuses on primitive type detection
      const result = detectFieldType([])
      expect(result).toBe('string') // typeof [] is 'object', but not a date
    })

    it('does not handle objects', () => {
      // Objects should be handled by inferrer
      const result = detectFieldType({})
      expect(result).toBe('string') // typeof {} is 'object', but not a date
    })
  })
})
