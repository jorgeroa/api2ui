/**
 * Executes API calls for MCP tool invocations.
 * Builds URLs, adds auth headers, handles path/query params.
 */

import type { ParsedOperation } from '@api2aux/semantic-analysis'
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
  /** Request metadata for debug output */
  request: {
    method: string
    url: string
    headers: Record<string, string>
  }
  /** Response time in milliseconds */
  elapsedMs: number
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

  const method = operation.method.toUpperCase()
  const init: RequestInit = {
    method,
    headers,
  }

  // Add body for non-GET methods
  if (args['body'] && method !== 'GET') {
    init.body = typeof args['body'] === 'string' ? args['body'] : JSON.stringify(args['body'])
  }

  const start = performance.now()
  const response = await fetch(url, init)
  const elapsedMs = Math.round(performance.now() - start)

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
    request: { method, url, headers },
    elapsedMs,
  }
}
