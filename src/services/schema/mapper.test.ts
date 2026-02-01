import { getDefaultComponent, mapToComponents } from './mapper'
import type { TypeSignature, UnifiedSchema } from '../../types/schema'

describe('getDefaultComponent', () => {
  describe('array types', () => {
    it('maps array of objects to table', () => {
      const type: TypeSignature = {
        kind: 'array',
        items: {
          kind: 'object',
          fields: new Map()
        }
      }
      expect(getDefaultComponent(type)).toBe('table')
    })

    it('maps array of primitives to list', () => {
      const type: TypeSignature = {
        kind: 'array',
        items: {
          kind: 'primitive',
          type: 'string'
        }
      }
      expect(getDefaultComponent(type)).toBe('list')
    })
  })

  describe('object types', () => {
    it('maps object to detail', () => {
      const type: TypeSignature = {
        kind: 'object',
        fields: new Map()
      }
      expect(getDefaultComponent(type)).toBe('detail')
    })
  })

  describe('primitive types', () => {
    it('maps string to text', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'string'
      }
      expect(getDefaultComponent(type)).toBe('text')
    })

    it('maps number to number', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'number'
      }
      expect(getDefaultComponent(type)).toBe('number')
    })

    it('maps boolean to boolean', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'boolean'
      }
      expect(getDefaultComponent(type)).toBe('boolean')
    })

    it('maps date to date', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'date'
      }
      expect(getDefaultComponent(type)).toBe('date')
    })

    it('maps null to text', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'null'
      }
      expect(getDefaultComponent(type)).toBe('text')
    })

    it('maps unknown to json', () => {
      const type: TypeSignature = {
        kind: 'primitive',
        type: 'unknown'
      }
      expect(getDefaultComponent(type)).toBe('json')
    })
  })
})

describe('mapToComponents', () => {
  describe('array of objects', () => {
    it('creates mappings for root and fields', () => {
      const schema: UnifiedSchema = {
        rootType: {
          kind: 'array',
          items: {
            kind: 'object',
            fields: new Map([
              ['id', {
                name: 'id',
                type: { kind: 'primitive', type: 'number' },
                optional: false,
                nullable: false,
                confidence: 'high',
                sampleValues: [1, 2]
              }],
              ['name', {
                name: 'name',
                type: { kind: 'primitive', type: 'string' },
                optional: false,
                nullable: false,
                confidence: 'high',
                sampleValues: ['Alice', 'Bob']
              }]
            ])
          }
        },
        url: 'https://api.example.com/users',
        sampleCount: 1,
        inferredAt: Date.now()
      }

      const mappings = mapToComponents(schema)

      expect(mappings.length).toBeGreaterThan(0)

      const rootMapping = mappings.find(m => m.path === '$')
      expect(rootMapping).toBeDefined()
      expect(rootMapping?.componentType).toBe('table')

      const idMapping = mappings.find(m => m.path === '$.id')
      expect(idMapping).toBeDefined()
      expect(idMapping?.componentType).toBe('number')

      const nameMapping = mappings.find(m => m.path === '$.name')
      expect(nameMapping).toBeDefined()
      expect(nameMapping?.componentType).toBe('text')
    })
  })

  describe('root object', () => {
    it('creates mappings for root and fields', () => {
      const schema: UnifiedSchema = {
        rootType: {
          kind: 'object',
          fields: new Map([
            ['id', {
              name: 'id',
              type: { kind: 'primitive', type: 'number' },
              optional: false,
              nullable: false,
              confidence: 'high',
              sampleValues: [1]
            }],
            ['active', {
              name: 'active',
              type: { kind: 'primitive', type: 'boolean' },
              optional: false,
              nullable: false,
              confidence: 'high',
              sampleValues: [true]
            }]
          ])
        },
        url: 'https://api.example.com/user',
        sampleCount: 1,
        inferredAt: Date.now()
      }

      const mappings = mapToComponents(schema)

      const rootMapping = mappings.find(m => m.path === '$')
      expect(rootMapping).toBeDefined()
      expect(rootMapping?.componentType).toBe('detail')

      const activeMapping = mappings.find(m => m.path === '$.active')
      expect(activeMapping).toBeDefined()
      expect(activeMapping?.componentType).toBe('boolean')
    })
  })

  describe('nested structures', () => {
    it('creates paths for nested fields', () => {
      const schema: UnifiedSchema = {
        rootType: {
          kind: 'object',
          fields: new Map([
            ['user', {
              name: 'user',
              type: {
                kind: 'object',
                fields: new Map([
                  ['name', {
                    name: 'name',
                    type: { kind: 'primitive', type: 'string' },
                    optional: false,
                    nullable: false,
                    confidence: 'high',
                    sampleValues: ['Alice']
                  }]
                ])
              },
              optional: false,
              nullable: false,
              confidence: 'high',
              sampleValues: [{ name: 'Alice' }]
            }]
          ])
        },
        url: 'https://api.example.com/data',
        sampleCount: 1,
        inferredAt: Date.now()
      }

      const mappings = mapToComponents(schema)

      const userMapping = mappings.find(m => m.path === '$.user')
      expect(userMapping).toBeDefined()
      expect(userMapping?.componentType).toBe('detail')

      const nameMapping = mappings.find(m => m.path === '$.user.name')
      expect(nameMapping).toBeDefined()
      expect(nameMapping?.componentType).toBe('text')
    })
  })
})
