import { useAppStore } from '../store/appStore'
import { fetchAPI } from '../services/api/fetcher'
import { inferSchema } from '../services/schema/inferrer'
import { parseOpenAPISpec } from '../services/openapi/parser'
import type { ParsedOperation } from '../services/openapi/types'

/**
 * Hook that provides a function to fetch and infer schema from a URL.
 * The function orchestrates: fetchAPI -> inferSchema -> store update.
 */
export function useAPIFetch() {
  const { startFetch, fetchSuccess, fetchError, specSuccess } = useAppStore()

  /**
   * Heuristic to detect if a URL points to an OpenAPI/Swagger spec
   */
  const isSpecUrl = (url: string): boolean => {
    const lower = url.toLowerCase()
    return (
      lower.endsWith('/openapi.json') ||
      lower.endsWith('/openapi.yaml') ||
      lower.endsWith('/swagger.json') ||
      lower.endsWith('/swagger.yaml') ||
      lower.endsWith('/api-docs') ||
      lower.endsWith('/v2/api-docs') ||
      lower.endsWith('/v3/api-docs') ||
      lower.includes('swagger') ||
      lower.includes('openapi')
    )
  }

  /**
   * Fetch and parse an OpenAPI spec URL
   */
  const fetchSpec = async (url: string) => {
    try {
      startFetch()
      const spec = await parseOpenAPISpec(url)
      specSuccess(spec)
    } catch (error) {
      if (error instanceof Error) {
        fetchError(error)
      } else {
        fetchError(new Error(String(error)))
      }
    }
  }

  /**
   * Fetch data from an OpenAPI operation with parameters
   */
  const fetchOperation = async (
    baseUrl: string,
    operation: ParsedOperation,
    params: Record<string, string>
  ) => {
    try {
      startFetch()

      // Build full URL starting with base + path
      let fullUrl = baseUrl + operation.path

      // Replace path parameters: {paramName} -> value
      for (const param of operation.parameters) {
        const value = params[param.name]
        if (param.in === 'path' && value) {
          fullUrl = fullUrl.replace(`{${param.name}}`, encodeURIComponent(value))
        }
      }

      // Append query parameters
      const queryParams = new URLSearchParams()
      for (const param of operation.parameters) {
        const value = params[param.name]
        if (param.in === 'query' && value) {
          queryParams.append(param.name, value)
        }
      }

      if (queryParams.toString()) {
        fullUrl += '?' + queryParams.toString()
      }

      // Fetch data from the built URL
      const data = await fetchAPI(fullUrl)

      // Infer schema from response
      const schema = inferSchema(data, fullUrl)

      // Store success result
      fetchSuccess(data, schema)
    } catch (error) {
      if (error instanceof Error) {
        fetchError(error)
      } else {
        fetchError(new Error(String(error)))
      }
    }
  }

  const fetchAndInfer = async (url: string) => {
    try {
      // Detect if this is a spec URL
      if (isSpecUrl(url)) {
        await fetchSpec(url)
        return
      }

      // Signal start of fetch
      startFetch()

      // Fetch raw data from API
      const data = await fetchAPI(url)

      // Infer schema from data
      const schema = inferSchema(data, url)

      // Store success result
      fetchSuccess(data, schema)
    } catch (error) {
      // Store error
      if (error instanceof Error) {
        fetchError(error)
      } else {
        fetchError(new Error(String(error)))
      }
    }
  }

  return { fetchAndInfer, fetchSpec, fetchOperation }
}
