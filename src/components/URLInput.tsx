import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useAPIFetch } from '../hooks/useAPIFetch'
import { useAuthStore } from '../store/authStore'
import { LockIcon } from './auth/LockIcon'
import { AuthPanel } from './auth/AuthPanel'
import type { AuthStatus } from '../types/auth'
import type { ParsedSecurityScheme } from '../services/openapi/types'

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
  {
    title: 'GitHub Profile',
    description: 'Single object with avatar, URLs, dates, and name detection',
    url: 'https://api.github.com/users/octocat',
    type: 'Object' as const,
  },
  {
    title: 'User Profiles',
    description: 'Phone numbers, birth dates, emails, and physical stats',
    url: 'https://dummyjson.com/users',
    type: 'Array' as const,
  },
  {
    title: 'Todo List',
    description: 'Boolean checkboxes, status indicators, and user references',
    url: 'https://dummyjson.com/todos',
    type: 'Array' as const,
  },
  {
    title: 'Quotes',
    description: 'Long text content suitable for markdown rendering',
    url: 'https://dummyjson.com/quotes',
    type: 'Array' as const,
  },
]

interface URLInputProps {
  authError?: { status: 401 | 403; message: string } | null
  detectedAuth?: ParsedSecurityScheme[]
}

export function URLInput({ authError, detectedAuth }: URLInputProps = {}) {
  const { url, setUrl, loading } = useAppStore()
  const { fetchAndInfer } = useAPIFetch()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [lastClickedExample, setLastClickedExample] = useState<string | null>(null)
  const [authPanelOpen, setAuthPanelOpen] = useState(false)

  // Auth state
  const getAuthStatus = useAuthStore((state) => state.getAuthStatus)
  const getCredentials = useAuthStore((state) => state.getCredentials)

  // Derive lock icon status from auth state
  const authStatus = getAuthStatus(url)
  const apiCreds = getCredentials(url)
  const hasActiveCredential = apiCreds?.activeType !== null && apiCreds?.activeType !== undefined

  // Lock status mapping:
  // - authError present -> 'failed' (red)
  // - 'untested' with active credential -> 'active' (green)
  // - 'success' -> 'active' (green)
  // - 'failed' -> 'failed' (red)
  // - no credentials -> 'untested' (gray)
  const lockStatus: AuthStatus =
    authError
      ? 'failed'
      : authStatus === 'success' || (authStatus === 'untested' && hasActiveCredential)
        ? 'success'
        : authStatus === 'failed'
          ? 'failed'
          : 'untested'

  // Auto-expand panel when auth error occurs
  useEffect(() => {
    if (authError) {
      setAuthPanelOpen(true)
    }
  }, [authError])

  // Auto-expand panel when spec has supported security schemes
  useEffect(() => {
    if (detectedAuth && detectedAuth.some(scheme => scheme.authType !== null)) {
      setAuthPanelOpen(true)
    }
  }, [detectedAuth])

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
            className="flex-1 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring/50 focus:border-transparent"
            disabled={loading}
          />
          <LockIcon
            status={lockStatus}
            activeType={apiCreds?.activeType}
            onClick={() => setAuthPanelOpen(!authPanelOpen)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
        </div>

        {/* Auth Panel */}
        <AuthPanel
          url={url}
          isOpen={authPanelOpen}
          onToggle={() => setAuthPanelOpen(!authPanelOpen)}
          authError={authError}
          detectedAuth={detectedAuth}
          onConfigureClick={() => setAuthPanelOpen(true)}
        />

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
              className="group relative p-4 border border-border rounded-lg text-left transition-all duration-150 hover:border-foreground/20 hover:shadow-sm hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed bg-card"
            >
              {/* Type badge */}
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 border ${
                example.type === 'OpenAPI'
                  ? 'border-purple-300 text-purple-700 dark:text-purple-400 dark:border-purple-700'
                  : example.type === 'Array'
                    ? 'border-green-300 text-green-700 dark:text-green-400 dark:border-green-700'
                    : 'border-border text-muted-foreground'
              }`}>
                {example.type}
              </span>

              {/* Title */}
              <h3 className="font-semibold text-foreground text-sm mb-1">{example.title}</h3>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{example.description}</p>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none">
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
