/**
 * Pre-defined operations for catalog APIs.
 * Used by both the seed endpoint and the seed script.
 */

import type { SerializableOperation } from '../types'

export interface CatalogSeedEntry {
  name: string
  baseUrl: string
  operations: SerializableOperation[]
}

export const CATALOG_SEED_DATA: CatalogSeedEntry[] = [
  {
    name: 'jsonplaceholder',
    baseUrl: 'https://jsonplaceholder.typicode.com',
    operations: [
      {
        path: '/users', method: 'GET', operationId: 'getUsers',
        summary: 'Get all users', parameters: [], responseSchema: null, tags: ['users'],
      },
      {
        path: '/users/{id}', method: 'GET', operationId: 'getUserById',
        summary: 'Get user by ID',
        parameters: [{ name: 'id', in: 'path', required: true, description: 'User ID', schema: { type: 'integer' } }],
        responseSchema: null, tags: ['users'],
      },
      {
        path: '/posts', method: 'GET', operationId: 'getPosts',
        summary: 'Get all posts',
        parameters: [{ name: 'userId', in: 'query', required: false, description: 'Filter by user ID', schema: { type: 'integer' } }],
        responseSchema: null, tags: ['posts'],
      },
      {
        path: '/posts/{id}', method: 'GET', operationId: 'getPostById',
        summary: 'Get post by ID',
        parameters: [{ name: 'id', in: 'path', required: true, description: 'Post ID', schema: { type: 'integer' } }],
        responseSchema: null, tags: ['posts'],
      },
      {
        path: '/posts/{postId}/comments', method: 'GET', operationId: 'getPostComments',
        summary: 'Get comments for a post',
        parameters: [{ name: 'postId', in: 'path', required: true, description: 'Post ID', schema: { type: 'integer' } }],
        responseSchema: null, tags: ['comments'],
      },
      {
        path: '/todos', method: 'GET', operationId: 'getTodos',
        summary: 'Get all todos',
        parameters: [{ name: 'userId', in: 'query', required: false, description: 'Filter by user ID', schema: { type: 'integer' } }],
        responseSchema: null, tags: ['todos'],
      },
    ],
  },
  {
    name: 'catfact',
    baseUrl: 'https://catfact.ninja',
    operations: [
      {
        path: '/fact', method: 'GET', operationId: 'getRandomFact',
        summary: 'Get a random cat fact', parameters: [], responseSchema: null, tags: ['facts'],
      },
      {
        path: '/facts', method: 'GET', operationId: 'getFacts',
        summary: 'Get a list of cat facts',
        parameters: [
          { name: 'limit', in: 'query', required: false, description: 'Number of facts', schema: { type: 'integer', default: 10 } },
          { name: 'page', in: 'query', required: false, description: 'Page number', schema: { type: 'integer' } },
        ],
        responseSchema: null, tags: ['facts'],
      },
    ],
  },
  {
    name: 'dogceo',
    baseUrl: 'https://dog.ceo/api',
    operations: [
      {
        path: '/breeds/list/all', method: 'GET', operationId: 'listAllBreeds',
        summary: 'List all dog breeds', parameters: [], responseSchema: null, tags: ['breeds'],
      },
      {
        path: '/breeds/image/random', method: 'GET', operationId: 'getRandomImage',
        summary: 'Get a random dog image', parameters: [], responseSchema: null, tags: ['images'],
      },
      {
        path: '/breed/{breed}/images/random', method: 'GET', operationId: 'getBreedImage',
        summary: 'Get a random image of a specific breed',
        parameters: [{ name: 'breed', in: 'path', required: true, description: 'Dog breed name (e.g., "labrador")', schema: { type: 'string' } }],
        responseSchema: null, tags: ['images'],
      },
    ],
  },
]
