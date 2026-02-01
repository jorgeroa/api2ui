import { useAppStore } from '../store/appStore'
import { fetchAPI } from '../services/api/fetcher'
import { inferSchema } from '../services/schema/inferrer'

/**
 * Hook that provides a function to fetch and infer schema from a URL.
 * The function orchestrates: fetchAPI -> inferSchema -> store update.
 */
export function useAPIFetch() {
  const { startFetch, fetchSuccess, fetchError } = useAppStore()

  const fetchAndInfer = async (url: string) => {
    try {
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

  return { fetchAndInfer }
}
