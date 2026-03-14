import { useState, useEffect } from 'react'
import { useAppStore, UrlMode } from '../store/appStore'
import { useAPIFetch } from '../hooks/useAPIFetch'
import { useAuthStore } from '../store/authStore'
import { LockIcon } from './auth/LockIcon'
import { AuthPanel } from './auth/AuthPanel'
import { ExamplesCarousel } from './ExamplesCarousel'
import { RequestBodyEditor } from './forms/RequestBodyEditor'
import type { AuthStatus } from '../types/auth'
import type { AuthScheme } from '@api2aux/semantic-analysis'

const URL_MODES = [
  { value: UrlMode.AUTO, label: 'Auto', tooltip: 'Auto-detect format from URL and content' },
  { value: UrlMode.SPEC, label: 'API Spec', tooltip: 'Treat as an OpenAPI or Swagger specification' },
  { value: UrlMode.GRAPHQL, label: 'GraphQL', tooltip: 'Discover operations via GraphQL introspection' },
  { value: UrlMode.ENDPOINT, label: 'Endpoint', tooltip: 'Treat as a direct API endpoint' },
] as const

interface URLInputProps {
  authError?: { status: 401 | 403; message: string } | null
  detectedAuth?: AuthScheme[]
}

export function URLInput({ authError, detectedAuth }: URLInputProps = {}) {
  const { url, setUrl, loading, schema, parsedSpec, error, httpMethod, setHttpMethod, requestBody, setRequestBody, reset, urlMode, setUrlMode, optionsOpen, setOptionsOpen, additionalEndpoints, addEndpoint, removeEndpoint, updateEndpoint } = useAppStore()
  const { fetchAndInfer, fetchMultiEndpoints } = useAPIFetch()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loadingExampleUrl, setLoadingExampleUrl] = useState<string | null>(null)
  const [authPanelOpen, setAuthPanelOpen] = useState(false)

  // Auth state
  const getAuthStatus = useAuthStore((state) => state.getAuthStatus)
  const getCredentials = useAuthStore((state) => state.getCredentials)

  // Derive lock icon status from auth state
  const authStatus = getAuthStatus(url)
  const apiCreds = getCredentials(url)
  const hasActiveCredential = apiCreds?.activeType !== null && apiCreds?.activeType !== undefined

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

    if (!url.trim()) {
      setValidationError('Please enter a URL')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setValidationError('URL must start with http:// or https://')
      return
    }

    setValidationError(null)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('api', url)
    window.history.pushState({}, '', newUrl.toString())

    if (urlMode === UrlMode.ENDPOINT && additionalEndpoints.length > 0) {
      fetchMultiEndpoints()
      return
    }

    const useCustomMethod = urlMode === UrlMode.ENDPOINT && httpMethod !== 'GET'
    fetchAndInfer(url, useCustomMethod ? { method: httpMethod, body: requestBody || undefined } : undefined)
  }

  const handleExampleClick = async (exampleUrl: string, method?: string, body?: string) => {
    setUrl(exampleUrl)
    setHttpMethod(method ?? 'GET')
    setRequestBody(body ?? '')
    setValidationError(null)
    setLoadingExampleUrl(exampleUrl)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('api', exampleUrl)
    window.history.pushState({}, '', newUrl.toString())

    const fetchOptions = method && method !== 'GET' ? { method, body: body || undefined } : undefined
    await fetchAndInfer(exampleUrl, fetchOptions)
    setLoadingExampleUrl(null)
  }

  const handleClear = () => {
    reset()
    setValidationError(null)
    setAuthPanelOpen(false)
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('api')
    cleanUrl.hash = ''
    window.history.pushState({}, '', cleanUrl.toString())
  }

  // Auto-clear stale data when user empties the URL input
  useEffect(() => {
    if (!url.trim() && (schema || parsedSpec)) {
      handleClear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const hasData = schema || parsedSpec
  const urlEmpty = !url.trim()
  const showCarousel = !loading && (urlEmpty || (!schema && !parsedSpec && !error))

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
          {(url || hasData) && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear and start over"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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

        {/* Collapsible Options section */}
        <div>
          <button
            type="button"
            onClick={() => setOptionsOpen(!optionsOpen)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform ${optionsOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Options
            {urlMode !== UrlMode.AUTO && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                {URL_MODES.find(m => m.value === urlMode)?.label}
              </span>
            )}
          </button>

          {optionsOpen && (
            <div className="mt-2 p-3 border border-border rounded-md bg-muted/20 space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Mode</span>
                <div className="inline-flex rounded-md border border-border overflow-hidden">
                  {URL_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      title={mode.tooltip}
                      onClick={() => {
                        setUrlMode(mode.value)
                        if (mode.value !== UrlMode.AUTO) setOptionsOpen(true)
                      }}
                      className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        urlMode === mode.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint-specific options: method selector + body */}
              {urlMode === UrlMode.ENDPOINT && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Method</span>
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="px-2 py-1 border border-input rounded-md bg-background text-xs font-mono focus:outline-none focus:ring-2 focus-visible:ring-ring/50"
                      disabled={loading}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  {httpMethod !== 'GET' && !parsedSpec && additionalEndpoints.length === 0 && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Request Body (JSON)
                      </label>
                      <RequestBodyEditor
                        value={requestBody}
                        onChange={setRequestBody}
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Additional endpoints */}
                  {additionalEndpoints.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">Additional Endpoints</span>
                      {additionalEndpoints.map((ep, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={ep.method}
                            onChange={(e) => updateEndpoint(i, 'method', e.target.value)}
                            className="px-2 py-1 border border-input rounded-md bg-background text-xs font-mono focus:outline-none focus:ring-2 focus-visible:ring-ring/50"
                            disabled={loading}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                          <input
                            type="text"
                            value={ep.url}
                            onChange={(e) => updateEndpoint(i, 'url', e.target.value)}
                            placeholder="https://api.example.com/resource"
                            className="flex-1 px-2 py-1 border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus-visible:ring-ring/50"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => removeEndpoint(i)}
                            className="px-1 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Remove endpoint"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addEndpoint}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    disabled={loading}
                  >
                    + Add endpoint
                  </button>
                </div>
              )}
            </div>
          )}
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

      {/* Compact examples carousel (only when no data loaded) */}
      {showCarousel && (
        <div className="mt-4">
          <ExamplesCarousel
            onExampleClick={handleExampleClick}
            loading={loading}
            loadingUrl={loadingExampleUrl}
          />
        </div>
      )}

      {/* "Try an example" link when data is loaded */}
      {hasData && !loading && !urlEmpty && (
        <div className="mt-2 text-center">
          <button
            onClick={() => {
              window.location.hash = '#/examples'
              window.dispatchEvent(new HashChangeEvent('hashchange'))
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Try another example &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
