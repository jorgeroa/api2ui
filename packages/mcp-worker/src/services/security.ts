/**
 * SSRF validation for API URLs submitted during registration.
 * Blocks private/internal IP ranges and localhost.
 */

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
]

const BLOCKED_TLD_PATTERNS = [
  /\.local$/,
  /\.internal$/,
  /\.localhost$/,
]

/**
 * Check if an IPv4 address falls in a private/reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p))) return false

  const [a, b] = parts as [number, number, number, number]

  // 127.0.0.0/8 — loopback
  if (a === 127) return true
  // 10.0.0.0/8 — private
  if (a === 10) return true
  // 172.16.0.0/12 — private
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true
  // 169.254.0.0/16 — link-local
  if (a === 169 && b === 254) return true
  // 0.0.0.0/8 — current network
  if (a === 0) return true

  return false
}

/**
 * Check if an IPv6 address is loopback or private.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()

  // ::1 — loopback
  if (normalized === '::1' || normalized === '[::1]') return true
  // fc00::/7 — unique local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  // fe80::/10 — link-local
  if (normalized.startsWith('fe80')) return true
  // ::ffff:x.x.x.x — IPv4-mapped
  if (normalized.startsWith('::ffff:')) {
    const v4 = normalized.slice(7)
    return isPrivateIPv4(v4)
  }

  return false
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validate that an API URL is safe to register (not targeting internal resources).
 */
export function validateApiUrl(urlString: string): ValidationResult {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }

  // Must be http or https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { valid: false, reason: 'Only http and https URLs are allowed' }
  }

  const hostname = url.hostname.toLowerCase()

  // Block known private hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, reason: 'Localhost URLs are not allowed' }
  }

  // Block private TLD patterns
  for (const pattern of BLOCKED_TLD_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, reason: `URLs with ${pattern.source} domains are not allowed` }
    }
  }

  // Check if hostname looks like an IP address
  if (isPrivateIPv4(hostname)) {
    return { valid: false, reason: 'Private/internal IP addresses are not allowed' }
  }

  // Check IPv6 (may be wrapped in brackets)
  const ipv6 = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname
  if (ipv6.includes(':') && isPrivateIPv6(ipv6)) {
    return { valid: false, reason: 'Private/internal IPv6 addresses are not allowed' }
  }

  return { valid: true }
}
