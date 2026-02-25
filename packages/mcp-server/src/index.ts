/**
 * @api2ui/mcp-server
 *
 * MCP server that turns any API into semantic-aware tools.
 * Use programmatically or via CLI (api2ui-mcp).
 */

export { createServer } from './server'
export { generateTools } from './tool-generator'
export { enrichTools } from './semantic-enrichment'
export { executeTool } from './tool-executor'
export { formatResponse } from './response-formatter'
export { generateClaudeDesktopConfig, generateClaudeCodeConfig, generateGenericConfig, detectLocalCliPath } from './config-generator'
export type { ServerConfig, AuthConfig } from './types'
export type { GeneratedTool } from './tool-generator'
export type { ExecutionResult } from './tool-executor'
export type { MCPClientConfig } from './config-generator'
