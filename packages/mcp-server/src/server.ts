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
 * Sanitize a query param name into a valid JS identifier.
 * e.g. "filter[name]" → "filter_name"
 */
function sanitizeParamName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Register a single "fetch" tool for a raw API URL.
 * Parses query params from the URL and exposes each as an individual
 * tool parameter with its default value, so Claude can override any
 * param cleanly without duplication.
 */
function registerRawAPITool(
  server: McpServer,
  apiUrl: string,
  auth: AuthConfig
): void {
  console.error(`[api2ui-mcp] Raw API mode: ${apiUrl}`)

  // Parse URL into base path and individual query params
  const parsed = new URL(apiUrl)
  const baseUrl = `${parsed.origin}${parsed.pathname}`
  const defaultParams: Array<{ original: string; sanitized: string; defaultValue: string }> = []
  const seenSanitized = new Set<string>()

  for (const [key, value] of parsed.searchParams.entries()) {
    let sanitized = sanitizeParamName(key)
    // Handle collisions by appending a number
    if (seenSanitized.has(sanitized)) {
      let i = 2
      while (seenSanitized.has(`${sanitized}_${i}`)) i++
      sanitized = `${sanitized}_${i}`
    }
    seenSanitized.add(sanitized)
    defaultParams.push({ original: key, sanitized, defaultValue: value })
  }

  // Build Zod input schema: path + each query param
  const inputSchema: Record<string, z.ZodTypeAny> = {
    path: z.string().optional().describe('Additional path segment to append (e.g., "/users/1")'),
  }

  for (const param of defaultParams) {
    const desc = param.original !== param.sanitized
      ? `Query param "${param.original}" (default: "${param.defaultValue}")`
      : `(default: "${param.defaultValue}")`
    inputSchema[param.sanitized] = z.string().optional().describe(desc)
  }

  const paramCount = defaultParams.length
  const description = paramCount > 0
    ? `Fetch data from ${baseUrl} with ${paramCount} configurable query parameters. Each parameter has a default value that can be overridden.`
    : `Fetch data from ${apiUrl}. Optionally append a path.`

  server.registerTool(
    'fetch_api',
    { description, inputSchema },
    async (args: Record<string, string | undefined>) => {
      try {
        let url = baseUrl
        if (args.path) {
          url = url.replace(/\/$/, '') + '/' + args.path.replace(/^\//, '')
        }

        // Rebuild query string from defaults + overrides
        if (defaultParams.length > 0) {
          const params = new URLSearchParams()
          for (const param of defaultParams) {
            const value = args[param.sanitized] ?? param.defaultValue
            params.append(param.original, value)
          }
          url += '?' + params.toString()
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

  console.error(`[api2ui-mcp] 1 tool registered (fetch_api) with ${paramCount} query parameters`)
}
