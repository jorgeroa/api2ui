#!/usr/bin/env node

/**
 * CLI entry point for the api2ui MCP server.
 *
 * Usage:
 *   api2ui-mcp --openapi https://petstore.swagger.io/v2/swagger.json
 *   api2ui-mcp --api https://jsonplaceholder.typicode.com
 *   api2ui-mcp --openapi URL --token YOUR_TOKEN
 *   api2ui-mcp --openapi URL --header "X-API-Key: secret"
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server'
import type { ServerConfig } from './types'

function parseArgs(argv: string[]): ServerConfig {
  const config: ServerConfig = {}
  let i = 2 // Skip node and script path

  while (i < argv.length) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--openapi':
        config.openapiUrl = next
        i += 2
        break
      case '--api':
        config.apiUrl = next
        i += 2
        break
      case '--name':
        config.name = next
        i += 2
        break
      case '--token':
        config.token = next
        i += 2
        break
      case '--header':
        config.header = next
        i += 2
        break
      case '--api-key':
        config.apiKey = next
        i += 2
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      case '--':
        i++
        break
      default:
        // Skip unknown args silently (node may inject extra args)
        i++
        break
    }
  }

  return config
}

function printHelp(): void {
  console.error(`
api2ui-mcp — Turn any API into MCP tools

Usage:
  api2ui-mcp --openapi <url>    Parse OpenAPI spec and register all operations as tools
  api2ui-mcp --api <url>        Register a single fetch tool for a raw API URL

Options:
  --openapi <url>     OpenAPI/Swagger spec URL
  --api <url>         Raw API base URL
  --name <name>       Server name (default: api2ui-mcp)
  --token <token>     Bearer token for API authentication
  --header <h:v>      Custom header (e.g., "X-API-Key: secret")
  --api-key <k=v>     API key as query param (e.g., "apiKey=secret")
  -h, --help          Show this help

Examples:
  api2ui-mcp --openapi https://petstore.swagger.io/v2/swagger.json
  api2ui-mcp --api https://jsonplaceholder.typicode.com --name jsonplaceholder
  api2ui-mcp --openapi https://api.example.com/openapi.json --token sk-xxx
`)
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv)

  if (!config.openapiUrl && !config.apiUrl) {
    console.error('Error: Either --openapi or --api must be specified\n')
    printHelp()
    process.exit(1)
  }

  try {
    const server = await createServer(config)
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('[api2ui-mcp] Server running on stdio')
  } catch (err) {
    console.error(`[api2ui-mcp] Fatal: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}

main()
