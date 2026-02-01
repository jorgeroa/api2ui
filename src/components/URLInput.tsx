import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useAPIFetch } from '../hooks/useAPIFetch'

const EXAMPLE_URLS = [
  {
    label: 'Array of users',
    url: 'https://jsonplaceholder.typicode.com/users',
  },
  {
    label: 'Single user',
    url: 'https://jsonplaceholder.typicode.com/users/1',
  },
  {
    label: 'Products with pagination',
    url: 'https://dummyjson.com/products',
  },
]

export function URLInput() {
  const { url, setUrl, loading } = useAppStore()
  const { fetchAndInfer } = useAPIFetch()
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!url.trim()) {
      setValidationError('Please enter a URL')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setValidationError('URL must start with http:// or https://')
      return
    }

    // Clear validation error and fetch
    setValidationError(null)
    fetchAndInfer(url)
  }

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl)
    setValidationError(null)
  }

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setValidationError(null)
            }}
            placeholder="https://jsonplaceholder.typicode.com/users"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>

        {validationError && (
          <div className="text-red-600 text-sm">{validationError}</div>
        )}
      </form>

      {/* Example links */}
      <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
        <span className="text-gray-600">Examples:</span>
        {EXAMPLE_URLS.map((example) => (
          <button
            key={example.url}
            onClick={() => handleExampleClick(example.url)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            type="button"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  )
}
