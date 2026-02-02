import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseOpenAPISpec } from '../parser'
import type { ParsedSpec } from '../types'

// Mock SwaggerParser to avoid network calls
vi.mock('@apidevtools/swagger-parser', () => ({
  default: {
    dereference: vi.fn(),
  },
}))

import SwaggerParser from '@apidevtools/swagger-parser'

// OpenAPI 3.0 fixture
const openapi3Fixture = {
  openapi: '3.0.3',
  info: {
    title: 'Pet Store API',
    version: '1.0.0',
  },
  servers: [
    { url: 'https://api.example.com/v1' },
  ],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List all pets',
        description: 'Returns a list of pets',
        tags: ['pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of items',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by status',
            required: true,
            schema: {
              type: 'string',
              enum: ['available', 'pending', 'sold'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a pet',
        tags: ['pets'],
        responses: {
          '201': {
            description: 'Created',
          },
        },
      },
    },
    '/pets/{petId}': {
      parameters: [
        {
          name: 'petId',
          in: 'path',
          required: true,
          description: 'Pet ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      get: {
        operationId: 'getPetById',
        summary: 'Get a pet by ID',
        tags: ['pets'],
        parameters: [
          {
            name: 'fields',
            in: 'query',
            description: 'Fields to include',
            required: false,
            schema: {
              type: 'string',
              maxLength: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: 'deletePet',
        summary: 'Delete a pet',
        tags: ['pets'],
        responses: {
          '204': {
            description: 'Deleted',
          },
        },
      },
    },
    '/users': {
      get: {
        operationId: 'listUsers',
        summary: 'List all users',
        tags: ['users'],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

// Swagger 2.0 fixture
const swagger2Fixture = {
  swagger: '2.0',
  info: {
    title: 'Legacy API',
    version: '2.5.0',
  },
  host: 'api.legacy.com',
  basePath: '/api/v2',
  schemes: ['https'],
  paths: {
    '/items': {
      get: {
        operationId: 'getItems',
        summary: 'Get items',
        tags: ['items'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Search query',
            required: false,
            type: 'string',
            format: 'email',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            schema: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
}

// Empty spec fixture
const emptySpecFixture = {
  openapi: '3.0.0',
  info: {
    title: 'Empty API',
    version: '1.0.0',
  },
  servers: [{ url: 'https://empty.com' }],
  paths: {},
}

describe('parseOpenAPISpec', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses OpenAPI 3.0 spec correctly', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    expect(result.title).toBe('Pet Store API')
    expect(result.version).toBe('1.0.0')
    expect(result.specVersion).toBe('3.0.3')
    expect(result.baseUrl).toBe('https://api.example.com/v1')
    expect(result.operations).toHaveLength(3) // 3 GET operations
  })

  it('parses Swagger 2.0 spec correctly', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(swagger2Fixture as never)

    const result = await parseOpenAPISpec(swagger2Fixture)

    expect(result.title).toBe('Legacy API')
    expect(result.version).toBe('2.5.0')
    expect(result.specVersion).toBe('2.0')
    expect(result.baseUrl).toBe('https://api.legacy.com/api/v2')
    expect(result.operations).toHaveLength(1)
  })

  it('extracts only GET operations', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    // Should have 3 GET operations (listPets, getPetById, listUsers)
    // Should NOT include POST (createPet) or DELETE (deletePet)
    expect(result.operations).toHaveLength(3)
    expect(result.operations.every(op => op.method === 'GET')).toBe(true)

    const operationIds = result.operations.map(op => op.operationId)
    expect(operationIds).toContain('listPets')
    expect(operationIds).toContain('getPetById')
    expect(operationIds).toContain('listUsers')
    expect(operationIds).not.toContain('createPet')
    expect(operationIds).not.toContain('deletePet')
  })

  it('extracts parameters with correct required flags', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    const listPets = result.operations.find(op => op.operationId === 'listPets')
    expect(listPets).toBeDefined()
    expect(listPets!.parameters).toHaveLength(2)

    const limitParam = listPets!.parameters.find(p => p.name === 'limit')
    expect(limitParam).toBeDefined()
    expect(limitParam!.required).toBe(false)
    expect(limitParam!.in).toBe('query')
    expect(limitParam!.schema.type).toBe('integer')
    expect(limitParam!.schema.minimum).toBe(1)
    expect(limitParam!.schema.maximum).toBe(100)
    expect(limitParam!.schema.default).toBe(20)

    const statusParam = listPets!.parameters.find(p => p.name === 'status')
    expect(statusParam).toBeDefined()
    expect(statusParam!.required).toBe(true)
  })

  it('detects path parameters and merges with operation parameters', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    const getPetById = result.operations.find(op => op.operationId === 'getPetById')
    expect(getPetById).toBeDefined()
    expect(getPetById!.path).toBe('/pets/{petId}')
    expect(getPetById!.parameters).toHaveLength(2) // petId (path-level) + fields (operation-level)

    const petIdParam = getPetById!.parameters.find(p => p.name === 'petId')
    expect(petIdParam).toBeDefined()
    expect(petIdParam!.in).toBe('path')
    expect(petIdParam!.required).toBe(true)
    expect(petIdParam!.schema.type).toBe('integer')

    const fieldsParam = getPetById!.parameters.find(p => p.name === 'fields')
    expect(fieldsParam).toBeDefined()
    expect(fieldsParam!.in).toBe('query')
    expect(fieldsParam!.required).toBe(false)
    expect(fieldsParam!.schema.maxLength).toBe(100)
  })

  it('extracts enum parameters', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    const listPets = result.operations.find(op => op.operationId === 'listPets')
    const statusParam = listPets!.parameters.find(p => p.name === 'status')

    expect(statusParam!.schema.enum).toEqual(['available', 'pending', 'sold'])
  })

  it('extracts base URL from OpenAPI 3.x servers', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    expect(result.baseUrl).toBe('https://api.example.com/v1')
  })

  it('extracts base URL from Swagger 2.0 host and basePath', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(swagger2Fixture as never)

    const result = await parseOpenAPISpec(swagger2Fixture)

    expect(result.baseUrl).toBe('https://api.legacy.com/api/v2')
  })

  it('handles Swagger 2.0 parameter format (type at root level)', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(swagger2Fixture as never)

    const result = await parseOpenAPISpec(swagger2Fixture)

    const getItems = result.operations.find(op => op.operationId === 'getItems')
    const searchParam = getItems!.parameters.find(p => p.name === 'search')

    expect(searchParam).toBeDefined()
    expect(searchParam!.schema.type).toBe('string')
    expect(searchParam!.schema.format).toBe('email')
  })

  it('handles empty spec without errors', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(emptySpecFixture as never)

    const result = await parseOpenAPISpec(emptySpecFixture)

    expect(result.operations).toEqual([])
    expect(result.title).toBe('Empty API')
  })

  it('throws descriptive error on invalid spec', async () => {
    const error = new Error('Invalid OpenAPI spec: missing required field')
    vi.mocked(SwaggerParser.dereference).mockRejectedValue(error)

    await expect(parseOpenAPISpec('https://invalid.com/spec')).rejects.toThrow(
      'Failed to parse OpenAPI spec'
    )
  })

  it('extracts response schemas correctly', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    const listPets = result.operations.find(op => op.operationId === 'listPets')
    expect(listPets!.responseSchema).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      },
    })
  })

  it('extracts operation metadata (summary, description, tags)', async () => {
    vi.mocked(SwaggerParser.dereference).mockResolvedValue(openapi3Fixture as never)

    const result = await parseOpenAPISpec(openapi3Fixture)

    const listPets = result.operations.find(op => op.operationId === 'listPets')
    expect(listPets!.summary).toBe('List all pets')
    expect(listPets!.description).toBe('Returns a list of pets')
    expect(listPets!.tags).toEqual(['pets'])
  })
})
