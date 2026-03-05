/**
 * Maps forwarded credentials from MCP client request headers
 * to the target API's auth format based on tenant config.
 */

import type { TenantConfig, AuthConfig } from '../types'

/**
 * Extract credentials from incoming request headers and map them
 * to the AuthConfig format expected by the tool executor.
 *
 * Supported forwarding headers:
 * - X-Forwarded-Api-Key: generic API key
 * - X-Api-Key: alternative API key header
 * - Authorization: forwarded as-is for bearer auth
 */
export function mapCredentials(request: Request, config: TenantConfig): AuthConfig {
  if (config.authType === 'none') {
    return { type: 'none' }
  }

  // Try multiple header names for the forwarded credential
  const forwardedKey =
    request.headers.get('X-Forwarded-Api-Key') ||
    request.headers.get('X-Api-Key') ||
    null

  const authHeader = request.headers.get('Authorization')

  switch (config.authType) {
    case 'bearer': {
      // Use Authorization header directly, or construct from forwarded key
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : forwardedKey
      if (!token) return { type: 'none' }
      return { type: 'bearer', token }
    }

    case 'header': {
      if (!config.authParamName || !forwardedKey) return { type: 'none' }
      return {
        type: 'header',
        headerName: config.authParamName,
        headerValue: forwardedKey,
      }
    }

    case 'apikey': {
      if (!config.authParamName || !forwardedKey) return { type: 'none' }
      return {
        type: 'apikey',
        paramName: config.authParamName,
        paramValue: forwardedKey,
      }
    }

    default:
      return { type: 'none' }
  }
}
