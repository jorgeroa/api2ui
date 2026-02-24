/**
 * Generates MCP client configuration snippets for Claude Desktop, Cursor, etc.
 */

import type { ServerConfig } from './types'

export interface MCPClientConfig {
  /** JSON object to add to the MCP client config */
  config: Record<string, unknown>
  /** Human-readable instructions */
  instructions: string
}

/**
 * Quote args that contain shell-special characters.
 */
function shellQuoteArgs(args: string[]): string {
  return args.map(a => /[&|;<>()$`\\ "'\t\n]/.test(a) ? `"${a}"` : a).join(' ')
}

/**
 * Build the CLI args array from a server config.
 */
function buildArgs(config: ServerConfig): string[] {
  const args: string[] = []

  if (config.openapiUrl) {
    args.push('--openapi', config.openapiUrl)
  } else if (config.apiUrl) {
    args.push('--api', config.apiUrl)
  }

  if (config.name) {
    args.push('--name', config.name)
  }

  if (config.token) {
    args.push('--token', config.token)
  }

  if (config.header) {
    args.push('--header', config.header)
  }

  if (config.apiKey) {
    args.push('--api-key', config.apiKey)
  }

  return args
}

/**
 * Generate a Claude Desktop configuration snippet.
 */
export function generateClaudeDesktopConfig(config: ServerConfig): MCPClientConfig {
  const serverName = config.name || 'api2ui'
  const args = buildArgs(config)

  const mcpConfig = {
    [serverName]: {
      command: 'npx',
      args: ['@api2ui/mcp-server', ...args],
    },
  }

  const configJson = JSON.stringify(mcpConfig, null, 2)

  return {
    config: mcpConfig,
    instructions: [
      `Add this to your Claude Desktop config file:`,
      ``,
      `macOS: ~/Library/Application Support/Claude/claude_desktop_config.json`,
      `Windows: %APPDATA%\\Claude\\claude_desktop_config.json`,
      ``,
      `Add to the "mcpServers" section:`,
      ``,
      configJson,
      ``,
      `Then restart Claude Desktop.`,
    ].join('\n'),
  }
}

/**
 * Generate a Claude Code (CLI) configuration snippet.
 */
export function generateClaudeCodeConfig(config: ServerConfig): MCPClientConfig {
  const serverName = config.name || 'api2ui'
  const args = buildArgs(config)

  const mcpConfig = {
    [serverName]: {
      command: 'npx',
      args: ['@api2ui/mcp-server', ...args],
    },
  }

  const configJson = JSON.stringify(mcpConfig, null, 2)

  return {
    config: mcpConfig,
    instructions: [
      `Add this to your Claude Code settings (~/.claude.json or project .claude/settings.json):`,
      ``,
      `Add to the "mcpServers" section:`,
      ``,
      configJson,
      ``,
      `Or use the CLI: claude mcp add ${serverName} -- npx @api2ui/mcp-server ${shellQuoteArgs(args)}`,
    ].join('\n'),
  }
}

/**
 * Generate a generic MCP client config (works with any stdio client).
 */
export function generateGenericConfig(config: ServerConfig): MCPClientConfig {
  const args = buildArgs(config)

  return {
    config: {
      command: 'npx',
      args: ['@api2ui/mcp-server', ...args],
    },
    instructions: [
      `Run the MCP server:`,
      ``,
      `  npx @api2ui/mcp-server ${shellQuoteArgs(args)}`,
      ``,
      `The server communicates over stdio using the MCP protocol.`,
    ].join('\n'),
  }
}
