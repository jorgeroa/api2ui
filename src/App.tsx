import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import { useConfigStore } from './store/configStore'
import { useAPIFetch } from './hooks/useAPIFetch'
import { URLInput } from './components/URLInput'
import { DynamicRenderer } from './components/DynamicRenderer'
import { ErrorDisplay } from './components/error/ErrorDisplay'
import { SkeletonTable } from './components/loading/SkeletonTable'
import { OperationSelector } from './components/openapi/OperationSelector'
import { ParameterForm } from './components/forms/ParameterForm'
import { ConfigToggle } from './components/config/ConfigToggle'
import { ConfigPanel } from './components/config/ConfigPanel'
import { ThemeApplier } from './components/config/ThemeApplier'
import { Sidebar } from './components/navigation/Sidebar'
import { LayoutContainer } from './components/layout/LayoutContainer'
import { parseUrlParameters, reconstructQueryString } from './services/urlParser/parser'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import 'react-loading-skeleton/dist/skeleton.css'

function App() {
  const {
    url,
    setUrl,
    loading,
    error,
    data,
    schema,
    parsedSpec,
    selectedOperationIndex,
    setSelectedOperation
  } = useAppStore()
  const { mode, setMode, clearFieldConfigs } = useConfigStore()
  const { fetchAndInfer, fetchOperation } = useAPIFetch()

  // Read api param from URL and auto-fetch on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const apiParam = params.get('api')
    if (apiParam) {
      setUrl(apiParam)
      fetchAndInfer(apiParam)
    }
  }, [])

  const handleRetry = () => {
    if (url) {
      fetchAndInfer(url)
    }
  }

  // Show toast notification on error
  useEffect(() => {
    if (error) {
      toast.error('Failed to fetch data', {
        description: String(error),
        duration: 5000,
      })
    }
  }, [error])

  // Derive selected operation
  const selectedOperation = parsedSpec?.operations[selectedOperationIndex]

  // Handle parameter form submission
  const handleParameterSubmit = (values: Record<string, string>) => {
    if (parsedSpec && selectedOperation) {
      fetchOperation(parsedSpec.baseUrl, selectedOperation, values)
    }
  }

  const handleSelectOperation = (index: number) => {
    clearFieldConfigs()
    setSelectedOperation(index)
  }

  const isConfigureMode = mode === 'configure'

  // Determine if we should show the sidebar
  const showSidebar = parsedSpec !== null && parsedSpec.operations.length >= 2

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      {/* Theme and style synchronization */}
      <ThemeApplier />

      {/* Configure mode indicator bar */}
      {isConfigureMode && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 flex items-center justify-between z-30 shadow-md">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="font-medium">Configure Mode</span>
          </div>
          <button
            onClick={() => setMode('view')}
            className="px-3 py-1 bg-white text-blue-600 font-medium rounded hover:bg-blue-50 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {showSidebar ? (
        // Sidebar layout for multi-endpoint specs
        <div className="flex min-h-screen bg-background text-text">
          <Sidebar
            parsedSpec={parsedSpec}
            selectedIndex={selectedOperationIndex}
            onSelect={handleSelectOperation}
          />
          <main
            id="main-content"
            className={`flex-1 overflow-y-auto py-8 px-6 ${isConfigureMode ? 'pt-20' : ''}`}
          >
            <div className={isConfigureMode ? 'ring-2 ring-blue-500 ring-offset-4' : ''}>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-text mb-2">api2ui</h1>
                <p className="text-lg text-gray-600">
                  Paste an API URL, see it rendered
                </p>
              </div>

              {/* URL Input */}
              <div className="flex justify-center mb-8">
                <URLInput />
              </div>

              {/* Main Content Area */}
              <div className="bg-surface rounded-lg shadow-md p-6 max-w-6xl mx-auto">
                {loading && !parsedSpec && <SkeletonTable />}

                {/* Standalone error (non-spec failures only) */}
                {error && !loading && !parsedSpec && (
                  <ErrorDisplay error={error} onRetry={handleRetry} />
                )}

                {/* OpenAPI Spec UI — stays visible even on operation errors */}
                {parsedSpec && !loading && (
                  <div className="space-y-6">
                    {/* Spec Info Header */}
                    <div className="border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-text">
                          {parsedSpec.title}
                        </h2>
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                          v{parsedSpec.version}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                          OpenAPI {parsedSpec.specVersion}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{parsedSpec.baseUrl}</p>
                    </div>

                    {/* No GET operations message */}
                    {parsedSpec.operations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">This API spec has no GET endpoints to display.</p>
                      </div>
                    )}

                    {/* Layout Container with Parameters and Results */}
                    {parsedSpec.operations.length > 0 && selectedOperation && (
                      <LayoutContainer
                        endpoint={`${parsedSpec.baseUrl}${selectedOperation.path}`}
                        parameters={
                          <ParameterForm
                            parameters={selectedOperation.parameters}
                            onSubmit={handleParameterSubmit}
                            loading={loading}
                            endpoint={`${parsedSpec.baseUrl}${selectedOperation.path}`}
                          />
                        }
                        results={
                          <>
                            {/* Inline operation error — form stays usable above */}
                            {error && <ErrorDisplay error={error} />}

                            {/* Loading indicator for operation fetch */}
                            {loading && <SkeletonTable />}

                            {/* Data Rendering (after fetching operation) */}
                            {schema && data !== null && (
                              <div className="border-t border-border pt-6">
                                <h3 className="text-lg font-semibold text-text mb-4">Response Data</h3>
                                <DynamicRenderer
                                  data={data}
                                  schema={schema.rootType}
                                  path="$"
                                  depth={0}
                                />
                              </div>
                            )}
                          </>
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      ) : (
        // Centered layout for single-endpoint and direct URLs
        <div className={`min-h-screen bg-background text-text py-8 px-4 ${isConfigureMode ? 'pt-20' : ''}`}>
          <div className={`max-w-6xl mx-auto ${isConfigureMode ? 'ring-2 ring-blue-500 ring-offset-4' : ''}`}>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-text mb-2">api2ui</h1>
              <p className="text-lg text-gray-600">
                Paste an API URL, see it rendered
              </p>
            </div>

            {/* URL Input */}
            <div className="flex justify-center mb-8">
              <URLInput />
            </div>

            {/* Main Content Area */}
            <div className="bg-surface rounded-lg shadow-md p-6">
              {loading && !parsedSpec && <SkeletonTable />}

              {/* Standalone error (non-spec failures only) */}
              {error && !loading && !parsedSpec && (
                <ErrorDisplay error={error} onRetry={handleRetry} />
              )}

              {/* OpenAPI Spec UI — stays visible even on operation errors */}
              {parsedSpec && !loading && (
                <div className="space-y-6">
                  {/* Spec Info Header */}
                  <div className="border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-text">
                        {parsedSpec.title}
                      </h2>
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                        v{parsedSpec.version}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                        OpenAPI {parsedSpec.specVersion}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{parsedSpec.baseUrl}</p>
                  </div>

                  {/* No GET operations message */}
                  {parsedSpec.operations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">This API spec has no GET endpoints to display.</p>
                    </div>
                  )}

                  {/* Operation Selector (single-endpoint only) */}
                  {parsedSpec.operations.length === 1 && (
                    <OperationSelector
                      operations={parsedSpec.operations}
                      selectedIndex={0}
                      onSelect={() => {}}
                    />
                  )}

                  {/* Layout Container with Parameters and Results */}
                  {parsedSpec.operations.length > 0 && selectedOperation && (
                    <LayoutContainer
                      endpoint={`${parsedSpec.baseUrl}${selectedOperation.path}`}
                      parameters={
                        <ParameterForm
                          parameters={selectedOperation.parameters}
                          onSubmit={handleParameterSubmit}
                          loading={loading}
                          endpoint={`${parsedSpec.baseUrl}${selectedOperation.path}`}
                        />
                      }
                      results={
                        <>
                          {/* Inline operation error — form stays usable above */}
                          {error && <ErrorDisplay error={error} />}

                          {/* Loading indicator for operation fetch */}
                          {loading && <SkeletonTable />}

                          {/* Data Rendering (after fetching operation) */}
                          {schema && data !== null && (
                            <div className="border-t border-border pt-6">
                              <h3 className="text-lg font-semibold text-text mb-4">Response Data</h3>
                              <DynamicRenderer
                                data={data}
                                schema={schema.rootType}
                                path="$"
                                depth={0}
                              />
                            </div>
                          )}
                        </>
                      }
                    />
                  )}
                </div>
              )}

              {/* Simple URL result (no query params, just data) */}
              {!parsedSpec && !loading && !error && schema && data !== null && url && !url.includes('?') && (
                <DynamicRenderer
                  data={data}
                  schema={schema.rootType}
                  path="$"
                  depth={0}
                />
              )}

              {/* Direct API URL flow (URLs with query params) */}
              {!parsedSpec && !loading && !error && url && url.includes('?') && (() => {
                const currentUrl = url
                const baseUrl = currentUrl.split('?')[0]!
                return (
                  <LayoutContainer
                    endpoint={baseUrl}
                    parameters={
                      <ParameterForm
                        parameters={[]}
                        rawUrl={currentUrl}
                        onSubmit={(values) => {
                          // Parse original URL to get original param keys
                          const { parameters: originalParams } = parseUrlParameters(currentUrl)
                          // Reconstruct preserving original key format (brackets etc)
                          const queryString = reconstructQueryString(values, originalParams)
                          const newUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl
                          fetchAndInfer(newUrl)
                        }}
                        loading={loading}
                        endpoint={baseUrl}
                      />
                    }
                    results={
                      <>
                        {/* Data rendering - show when data is present */}
                        {schema && data !== null && (
                          <DynamicRenderer
                            data={data}
                            schema={schema.rootType}
                            path="$"
                            depth={0}
                          />
                        )}
                      </>
                    }
                  />
                )
              })()}

              {/* Welcome Message */}
              {!loading && !error && !schema && !parsedSpec && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl mb-2">Welcome to api2ui</p>
                  <p className="text-sm">
                    Enter a JSON API URL above and click Fetch to see your data
                    rendered as a beautiful UI.
                  </p>
                  <p className="text-sm mt-2">
                    Try one of the example links to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating config toggle and panel */}
      <ConfigToggle />
      <ConfigPanel />

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
