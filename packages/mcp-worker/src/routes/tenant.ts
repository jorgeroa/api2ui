/**
 * MCP endpoint for tenant APIs: ALL /t/:tenantId
 * Handles MCP JSON-RPC requests using stateless Streamable HTTP transport.
 */

import { Hono } from 'hono'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { AppEnv } from '../index'
import { createWorkerServer } from '../services/server-factory'
import { mapCredentials } from '../services/credential-mapper'

const tenant = new Hono<AppEnv>()

tenant.all('/t/:tenantId', async (c) => {
  const tenantId = c.req.param('tenantId')
  const store = c.get('store')

  const config = await store.get(`tenant:${tenantId}`)
  if (!config) {
    return c.json({ error: 'Tenant not found' }, 404)
  }

  // Map forwarded credentials to auth config
  const auth = mapCredentials(c.req.raw, config)

  // Create stateless MCP server for this request
  const server = createWorkerServer(config, auth)

  // Create stateless transport (no session tracking)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)

  return transport.handleRequest(c.req.raw)
})

export { tenant }
