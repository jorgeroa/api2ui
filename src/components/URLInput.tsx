import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useAPIFetch } from '../hooks/useAPIFetch'

const EXAMPLES = [
  {
    title: 'User Directory',
    description: 'Array of user objects with nested address and company data',
    url: 'https://jsonplaceholder.typicode.com/users',
    type: 'Array' as const,
  },
  {
    title: 'Single User',
    description: 'Detailed object view with nested fields',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    type: 'Object' as const,
  },
  {
    title: 'Product Catalog',
    description: 'Paginated product list with images and ratings',
    url: 'https://dummyjson.com/products',
    type: 'Array' as const,
  },
  {
    title: 'Pet Store API',
    description: 'OpenAPI spec with multiple endpoints and tag-based navigation',
    url: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'OpenAPI' as const,
  },
]

export function URLInput() {
  const { url, setUrl, loading } = useAppStore()
  const { fetchAndInfer } = useAPIFetch()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [lastClickedExample, setLastClickedExample] = useState<string | null>(null)

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

    // Update browser URL with api param for shareable links
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('api', url)
    window.history.pushState({}, '', newUrl.toString())

    fetchAndInfer(url)
  }

  const handleExampleClick = async (exampleUrl: string) => {
    setUrl(exampleUrl)
    setValidationError(null)
    setLastClickedExample(exampleUrl)

    // Update browser URL with api param for shareable links
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('api', exampleUrl)
    window.history.pushState({}, '', newUrl.toString())

    await fetchAndInfer(exampleUrl)
    setLastClickedExample(null)
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

      {/* Example API cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EXAMPLES.map((example) => {
          const isLoading = lastClickedExample === example.url && loading
          return (
            <button
              key={example.url}
              onClick={() => handleExampleClick(example.url)}
              disabled={loading}
              className="group relative p-4 border border-border rounded-lg text-left transition-all hover:border-blue-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-surface"
            >
              {/* Type badge */}
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${
                example.type === 'OpenAPI'
                  ? 'bg-purple-100 text-purple-700'
                  : example.type === 'Array'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {example.type}
              </span>

              {/* Title */}
              <h3 className="font-semibold text-text text-sm mb-1">{example.title}</h3>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed">{example.description}</p>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
