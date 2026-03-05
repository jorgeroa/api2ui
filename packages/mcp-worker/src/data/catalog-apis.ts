/**
 * Hardcoded list of public no-auth APIs available in the catalog.
 * These are seeded into KV by scripts/seed-catalog.ts.
 */

export interface CatalogApiEntry {
  name: string
  description: string
  category: string
  apiUrl: string
  /** Operations to seed — defined in the seed script, not here */
}

export const CATALOG_APIS: CatalogApiEntry[] = [
  {
    name: 'jsonplaceholder',
    description: 'Fake REST API for testing and prototyping — users, posts, comments, todos',
    category: 'testing',
    apiUrl: 'https://jsonplaceholder.typicode.com',
  },
  {
    name: 'catfact',
    description: 'Random cat facts API',
    category: 'fun',
    apiUrl: 'https://catfact.ninja',
  },
  {
    name: 'dogceo',
    description: 'Random dog images API — breeds, sub-breeds, random images',
    category: 'fun',
    apiUrl: 'https://dog.ceo/api',
  },
]
