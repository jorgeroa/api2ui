import { CORSError, NetworkError, APIError, ParseError } from './errors'

/**
 * Fetch JSON data from an API URL with typed error handling.
 * Detects CORS, network, HTTP, and parse errors.
 */
export async function fetchAPI(url: string): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
      },
    })
  } catch (error) {
    // TypeError: Failed to fetch indicates CORS or network issue
    if (error instanceof TypeError) {
      // Heuristic: if we can't distinguish CORS from network,
      // try a HEAD request to check connectivity
      const isCORS = await detectCORS(url)
      if (isCORS) throw new CORSError(url)
      throw new NetworkError(url)
    }
    throw new NetworkError(url)
  }

  if (!response.ok) {
    throw new APIError(url, response.status, response.statusText)
  }

  try {
    return await response.json()
  } catch {
    throw new ParseError(url)
  }
}

/**
 * Heuristic CORS detection: attempt fetch with no-cors mode.
 * If no-cors succeeds (opaque response), the server exists but blocks CORS.
 * If it also fails, it's likely a network error.
 */
async function detectCORS(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { mode: 'no-cors' })
    // Opaque response = server exists, CORS blocked
    return response.type === 'opaque'
  } catch {
    // Both modes failed = network error
    return false
  }
}
