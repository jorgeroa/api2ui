import { describe, it, expect } from 'vitest'

// We test the pure helper functions exported indirectly through server behavior.
// Since parseAuth, maskHeaders, formatDebugInfo, sanitizeParamName are not exported,
// we test them through createServer's validation and re-implement the logic tests here.

// For now, test createServer's input validation (which is the public API).
import { createServer } from './server'

describe('createServer', () => {
  it('throws when neither openapi nor api url is provided', async () => {
    await expect(createServer({})).rejects.toThrow('Either --openapi or --api must be specified')
  })

  it('throws when given an invalid openapi url', async () => {
    await expect(
      createServer({ openapiUrl: 'not-a-real-url' })
    ).rejects.toThrow('Failed to parse OpenAPI spec')
  })
})
