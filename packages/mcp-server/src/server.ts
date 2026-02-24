/**
 * MCP Server that registers API operations as tools.
 * Accepts an OpenAPI spec URL or raw API URL and creates tools dynamically.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { parseOpenAPISpec } from '@api2ui/semantic-analysis'
import type { ParsedSpec } from '@api2ui/semantic-analysis'
import { generateTools } from './tool-generator'
import { enrichTools } from './semantic-enrichment'
import { executeTool } from './tool-executor'
import type { ServerConfig, AuthConfig } from './types'

/**
 * Parse auth config from CLI options.
 */
function parseAuth(config: ServerConfig): AuthConfig {
  if (config.token) {
    return { type: 'bearer', token: config.token }
  }
  if (config.header) {
    const colonIdx = config.header.indexOf(':')
    if (colonIdx > 0) {
      return {
        type: 'header',
        headerName: config.header.slice(0, colonIdx).trim(),
        headerValue: config.header.slice(colonIdx + 1).trim(),
      }
    }
  }
  if (config.apiKey) {
    const eqIdx = config.apiKey.indexOf('=')
    if (eqIdx > 0) {
      return {
        type: 'apikey',
        paramName: config.apiKey.slice(0, eqIdx),
        paramValue: config.apiKey.slice(eqIdx + 1),
      }
    }
  }
  return { type: 'none' }
}

/**
 * Create and configure an MCP server from a config.
 * Returns the server instance (call .connect(transport) to start).
 */
export async function createServer(config: ServerConfig): Promise<McpServer> {
  const serverName = config.name || 'api2ui-mcp'

  const server = new McpServer({
    name: serverName,
    version: '0.1.0',
  })

  const auth = parseAuth(config)

  if (config.openapiUrl) {
    // OpenAPI mode: parse spec and generate tools for each operation
    await registerOpenAPITools(server, config.openapiUrl, auth)
  } else if (config.apiUrl) {
    // Raw API mode: register a single fetch tool
    registerRawAPITool(server, config.apiUrl, auth)
  } else {
    throw new Error('Either --openapi or --api must be specified')
  }

  return server
}

/**
 * Parse an OpenAPI spec and register each operation as an MCP tool.
 */
async function registerOpenAPITools(
  server: McpServer,
  specUrl: string,
  auth: AuthConfig
): Promise<void> {
  let spec: ParsedSpec

  try {
    spec = await parseOpenAPISpec(specUrl)
  } catch (err) {
    throw new Error(`Failed to parse OpenAPI spec at ${specUrl}: ${err instanceof Error ? err.message : String(err)}`)
  }

  const baseUrl = spec.baseUrl
  const rawTools = generateTools(spec.operations)

  console.error(`[api2ui-mcp] Parsed "${spec.title}" v${spec.version} (${spec.specVersion})`)
  console.error(`[api2ui-mcp] Base URL: ${baseUrl}`)
  console.error(`[api2ui-mcp] Enriching ${rawTools.length} tools with semantic analysis...`)

  const tools = await enrichTools(rawTools, baseUrl, { fetchSamples: true })

  console.error(`[api2ui-mcp] Registering ${tools.length} tools...`)

  for (const tool of tools) {
    const hasInputs = Object.keys(tool.inputSchema).length > 0

    if (hasInputs) {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (args) => {
          try {
            const result = await executeTool(baseUrl, tool.operation, args as Record<string, unknown>, auth)

            if (result.status >= 400) {
              return {
                content: [{
                  type: 'text' as const,
                  text: `API error ${result.status}: ${JSON.stringify(result.data, null, 2)}`,
                }],
                isError: true,
              }
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result.data, null, 2),
              }],
            }
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: `Request failed: ${err instanceof Error ? err.message : String(err)}`,
              }],
              isError: true,
            }
          }
        }
      )
    } else {
      // No input parameters — register without inputSchema
      server.registerTool(
        tool.name,
        { description: tool.description },
        async () => {
          try {
            const result = await executeTool(baseUrl, tool.operation, {}, auth)

            if (result.status >= 400) {
              return {
                content: [{
                  type: 'text' as const,
                  text: `API error ${result.status}: ${JSON.stringify(result.data, null, 2)}`,
                }],
                isError: true,
              }
            }

            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify(result.data, null, 2),
              }],
            }
          } catch (err) {
            return {
              content: [{
                type: 'text' as const,
                text: `Request failed: ${err instanceof Error ? err.message : String(err)}`,
              }],
              isError: true,
            }
          }
        }
      )
    }
  }

  console.error(`[api2ui-mcp] ${tools.length} tools registered`)
}

/**
 * Register a single "fetch" tool for a raw API URL.
 * Allows Claude to fetch the API with optional path/query customization.
 */
function registerRawAPITool(
  server: McpServer,
  apiUrl: string,
  auth: AuthConfig
): void {
  console.error(`[api2ui-mcp] Raw API mode: ${apiUrl}`)

  server.registerTool(
    'fetch_api',
    {
      description: `Fetch data from ${apiUrl}. Optionally append a path or query parameters.`,
      inputSchema: {
        path: z.string().optional().describe('Additional path to append (e.g., "/users/1")'),
        query: z.string().optional().describe('Query string to append (e.g., "page=2&limit=10")'),
      },
    },
    async (args: { path?: string; query?: string }) => {
      try {
        let url = apiUrl
        if (args.path) {
          url = url.replace(/\/$/, '') + '/' + args.path.replace(/^\//, '')
        }
        if (args.query) {
          url += (url.includes('?') ? '&' : '?') + args.query
        }

        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (auth.type === 'bearer' && auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`
        } else if (auth.type === 'header' && auth.headerName && auth.headerValue) {
          headers[auth.headerName] = auth.headerValue
        }

        const response = await fetch(url, { headers })
        const data = await response.json()

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(data, null, 2),
          }],
        }
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        }
      }
    }
  )

  console.error(`[api2ui-mcp] 1 tool registered (fetch_api)`)
}
