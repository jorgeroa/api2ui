/**
 * Executes API calls for MCP tool invocations.
 * Builds URLs, adds auth headers, handles path/query params.
 */

import type { ParsedOperation } from '@api2ui/semantic-analysis'
import type { AuthConfig } from './types'

/**
 * Build the full URL for an API call, interpolating path params and appending query params.
 */
function buildUrl(
  baseUrl: string,
  operation: ParsedOperation,
  args: Record<string, unknown>
): string {
  // Interpolate path parameters
  let path = operation.path
  for (const param of operation.parameters) {
    if (param.in === 'path' && args[param.name] !== undefined) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(String(args[param.name])))
    }
  }

  const url = new URL(path, baseUrl)

  // Add query parameters
  for (const param of operation.parameters) {
    if (param.in === 'query' && args[param.name] !== undefined) {
      url.searchParams.set(param.name, String(args[param.name]))
    }
  }

  return url.toString()
}

/**
 * Build request headers including auth and custom headers from params.
 */
function buildHeaders(
  operation: ParsedOperation,
  args: Record<string, unknown>,
  auth: AuthConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  // Auth headers
  switch (auth.type) {
    case 'bearer':
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
      break
    case 'header':
      if (auth.headerName && auth.headerValue) headers[auth.headerName] = auth.headerValue
      break
    // apikey is handled as query param in buildUrl or here as header
  }

  // Header parameters from the operation
  for (const param of operation.parameters) {
    if (param.in === 'header' && args[param.name] !== undefined) {
      headers[param.name] = String(args[param.name])
    }
  }

  // Add Content-Type for requests with body
  if (operation.requestBody && args['body']) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

/** Result of executing an API call */
export interface ExecutionResult {
  status: number
  data: unknown
  headers: Record<string, string>
}

/**
 * Execute an API call for a tool invocation.
 */
export async function executeTool(
  baseUrl: string,
  operation: ParsedOperation,
  args: Record<string, unknown>,
  auth: AuthConfig
): Promise<ExecutionResult> {
  const url = buildUrl(baseUrl, operation, args)
  const headers = buildHeaders(operation, args, auth)

  // Add API key as query param if configured
  if (auth.type === 'apikey' && auth.paramName && auth.paramValue) {
    const urlObj = new URL(url)
    urlObj.searchParams.set(auth.paramName, auth.paramValue)
  }

  const init: RequestInit = {
    method: operation.method.toUpperCase(),
    headers,
  }

  // Add body for non-GET methods
  if (args['body'] && operation.method.toUpperCase() !== 'GET') {
    init.body = typeof args['body'] === 'string' ? args['body'] : JSON.stringify(args['body'])
  }

  const response = await fetch(url, init)

  // Collect response headers
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  // Parse response
  let data: unknown
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  return {
    status: response.status,
    data,
    headers: responseHeaders,
  }
}
