/**
 * Executes API calls for MCP tool invocations.
 * Adapted from packages/mcp-server/src/tool-executor.ts — uses local types.
 */

import type { SerializableOperation, AuthConfig } from '../types'

function buildUrl(
  baseUrl: string,
  operation: SerializableOperation,
  args: Record<string, unknown>
): string {
  let path = operation.path
  for (const param of operation.parameters) {
    if (param.in === 'path' && args[param.name] !== undefined) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(String(args[param.name])))
    }
  }

  const url = new URL(path, baseUrl)

  for (const param of operation.parameters) {
    if (param.in === 'query' && args[param.name] !== undefined) {
      url.searchParams.set(param.name, String(args[param.name]))
    }
  }

  return url.toString()
}

function buildHeaders(
  operation: SerializableOperation,
  args: Record<string, unknown>,
  auth: AuthConfig
): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  switch (auth.type) {
    case 'bearer':
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
      break
    case 'header':
      if (auth.headerName && auth.headerValue) headers[auth.headerName] = auth.headerValue
      break
  }

  for (const param of operation.parameters) {
    if (param.in === 'header' && args[param.name] !== undefined) {
      headers[param.name] = String(args[param.name])
    }
  }

  if (operation.requestBody && args['body']) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

export interface ExecutionResult {
  status: number
  data: unknown
  headers: Record<string, string>
  request: { method: string; url: string; headers: Record<string, string> }
  elapsedMs: number
}

export async function executeTool(
  baseUrl: string,
  operation: SerializableOperation,
  args: Record<string, unknown>,
  auth: AuthConfig
): Promise<ExecutionResult> {
  let url = buildUrl(baseUrl, operation, args)
  const headers = buildHeaders(operation, args, auth)

  // Add API key as query param if configured
  if (auth.type === 'apikey' && auth.paramName && auth.paramValue) {
    const urlObj = new URL(url)
    urlObj.searchParams.set(auth.paramName, auth.paramValue)
    url = urlObj.toString()
  }

  const method = operation.method.toUpperCase()
  const init: RequestInit = { method, headers }

  if (args['body'] && method !== 'GET') {
    init.body = typeof args['body'] === 'string' ? args['body'] : JSON.stringify(args['body'])
  }

  const start = performance.now()
  const response = await fetch(url, init)
  const elapsedMs = Math.round(performance.now() - start)

  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

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
