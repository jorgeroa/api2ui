import { inferSchema } from './inferrer'
import type { TypeSignature } from '../../types/schema'

describe('inferSchema', () => {
  const testUrl = 'https://api.example.com/test'

  describe('array of flat objects', () => {
    it('infers array with object items', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
      const schema = inferSchema(data, testUrl)

      expect(schema.rootType.kind).toBe('array')
      expect(schema.url).toBe(testUrl)
      expect(schema.sampleCount).toBe(1)
      expect(typeof schema.inferredAt).toBe('number')

      if (schema.rootType.kind === 'array') {
        const items = schema.rootType.items
        expect(items.kind).toBe('object')

        if (items.kind === 'object') {
          expect(items.fields.size).toBe(2)

          const idField = items.fields.get('id')
          expect(idField).toBeDefined()
          expect(idField?.type.kind).toBe('primitive')
          if (idField?.type.kind === 'primitive') {
            expect(idField.type.type).toBe('number')
          }
          expect(idField?.optional).toBe(false)
          expect(idField?.nullable).toBe(false)

          const nameField = items.fields.get('name')
          expect(nameField).toBeDefined()
          expect(nameField?.type.kind).toBe('primitive')
          if (nameField?.type.kind === 'primitive') {
            expect(nameField.type.type).toBe('string')
          }
        }
      }
    })
  })

  describe('single object', () => {
    it('infers object with fields', () => {
      const data = { id: 1, name: 'Alice', email: 'alice@example.com' }
      const schema = inferSchema(data, testUrl)

      expect(schema.rootType.kind).toBe('object')
      if (schema.rootType.kind === 'object') {
        expect(schema.rootType.fields.size).toBe(3)

        const idField = schema.rootType.fields.get('id')
        expect(idField?.type.kind).toBe('primitive')
        if (idField?.type.kind === 'primitive') {
          expect(idField.type.type).toBe('number')
        }

        const emailField = schema.rootType.fields.get('email')
        expect(emailField?.type.kind).toBe('primitive')
        if (emailField?.type.kind === 'primitive') {
          expect(emailField.type.type).toBe('string')
        }
      }
    })
  })

  describe('optional fields', () => {
    it('marks fields present in some items as optional', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2 }
      ]
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
        const nameField = schema.rootType.items.fields.get('name')
        expect(nameField?.optional).toBe(true)

        const idField = schema.rootType.items.fields.get('id')
        expect(idField?.optional).toBe(false) // present in all items
      }
    })
  })

  describe('nullable fields', () => {
    it('marks fields with null values as nullable', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: null }
      ]
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
        const nameField = schema.rootType.items.fields.get('name')
        expect(nameField?.nullable).toBe(true)
      }
    })
  })

  describe('nested objects', () => {
    it('handles nested object fields', () => {
      const data = { user: { name: 'Alice', age: 30 } }
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'object') {
        const userField = schema.rootType.fields.get('user')
        expect(userField?.type.kind).toBe('object')

        if (userField?.type.kind === 'object') {
          expect(userField.type.fields.size).toBe(2)

          const nameField = userField.type.fields.get('name')
          expect(nameField?.type.kind).toBe('primitive')
          if (nameField?.type.kind === 'primitive') {
            expect(nameField.type.type).toBe('string')
          }

          const ageField = userField.type.fields.get('age')
          expect(ageField?.type.kind).toBe('primitive')
          if (ageField?.type.kind === 'primitive') {
            expect(ageField.type.type).toBe('number')
          }
        }
      }
    })
  })

  describe('nested arrays', () => {
    it('handles nested array fields', () => {
      const data = { users: [{ name: 'Alice' }, { name: 'Bob' }] }
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'object') {
        const usersField = schema.rootType.fields.get('users')
        expect(usersField?.type.kind).toBe('array')

        if (usersField?.type.kind === 'array') {
          expect(usersField.type.items.kind).toBe('object')

          if (usersField.type.items.kind === 'object') {
            const nameField = usersField.type.items.fields.get('name')
            expect(nameField?.type.kind).toBe('primitive')
            if (nameField?.type.kind === 'primitive') {
              expect(nameField.type.type).toBe('string')
            }
          }
        }
      }
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      const schema = inferSchema([], testUrl)
      expect(schema.rootType.kind).toBe('array')
      if (schema.rootType.kind === 'array') {
        expect(schema.rootType.items.kind).toBe('primitive')
        if (schema.rootType.items.kind === 'primitive') {
          expect(schema.rootType.items.type).toBe('unknown')
        }
      }
    })

    it('handles primitive root (string)', () => {
      const schema = inferSchema('hello', testUrl)
      expect(schema.rootType.kind).toBe('primitive')
      if (schema.rootType.kind === 'primitive') {
        expect(schema.rootType.type).toBe('string')
      }
    })

    it('handles primitive root (number)', () => {
      const schema = inferSchema(42, testUrl)
      expect(schema.rootType.kind).toBe('primitive')
      if (schema.rootType.kind === 'primitive') {
        expect(schema.rootType.type).toBe('number')
      }
    })

    it('handles null root', () => {
      const schema = inferSchema(null, testUrl)
      expect(schema.rootType.kind).toBe('primitive')
      if (schema.rootType.kind === 'primitive') {
        expect(schema.rootType.type).toBe('null')
      }
    })

    it('handles empty object', () => {
      const schema = inferSchema({}, testUrl)
      expect(schema.rootType.kind).toBe('object')
      if (schema.rootType.kind === 'object') {
        expect(schema.rootType.fields.size).toBe(0)
      }
    })
  })

  describe('date detection', () => {
    it('detects ISO date fields', () => {
      const data = { created: '2026-02-01T12:00:00Z', name: 'test' }
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'object') {
        const createdField = schema.rootType.fields.get('created')
        expect(createdField?.type.kind).toBe('primitive')
        if (createdField?.type.kind === 'primitive') {
          expect(createdField.type.type).toBe('date')
        }
      }
    })
  })

  describe('confidence and samples', () => {
    it('collects sample values', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ]
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
        const idField = schema.rootType.items.fields.get('id')
        expect(idField?.sampleValues.length).toBeGreaterThan(0)
        expect(idField?.sampleValues.length).toBeLessThanOrEqual(5)
      }
    })

    it('sets high confidence when all items agree', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
        const idField = schema.rootType.items.fields.get('id')
        expect(idField?.confidence).toBe('high')
      }
    })

    it('sets medium confidence for partial presence', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3 }
      ]
      const schema = inferSchema(data, testUrl)

      if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
        const nameField = schema.rootType.items.fields.get('name')
        // 2/3 = 66.7%, should be medium (<=70%)
        expect(nameField?.confidence).toBe('medium')
      }
    })
  })
})
