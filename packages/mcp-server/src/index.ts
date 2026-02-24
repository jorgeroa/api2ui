/**
 * @api2ui/mcp-server
 *
 * MCP server that turns any API into semantic-aware tools.
 * Use programmatically or via CLI (api2ui-mcp).
 */

export { createServer } from './server'
export { generateTools } from './tool-generator'
export { executeTool } from './tool-executor'
export type { ServerConfig, AuthConfig } from './types'
export type { GeneratedTool } from './tool-generator'
export type { ExecutionResult } from './tool-executor'
