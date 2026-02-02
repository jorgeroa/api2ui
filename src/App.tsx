import { useAppStore } from './store/appStore'
import { useAPIFetch } from './hooks/useAPIFetch'
import { URLInput } from './components/URLInput'
import { DynamicRenderer } from './components/DynamicRenderer'
import { ErrorDisplay } from './components/error/ErrorDisplay'
import { SkeletonTable } from './components/loading/SkeletonTable'
import { OperationSelector } from './components/openapi/OperationSelector'
import { ParameterForm } from './components/forms/ParameterForm'
import 'react-loading-skeleton/dist/skeleton.css'

function App() {
  const {
    url,
    loading,
    error,
    data,
    schema,
    parsedSpec,
    selectedOperationIndex,
    setSelectedOperation
  } = useAppStore()
  const { fetchAndInfer, fetchOperation } = useAPIFetch()

  const handleRetry = () => {
    if (url) {
      fetchAndInfer(url)
    }
  }

  // Derive selected operation
  const selectedOperation = parsedSpec?.operations[selectedOperationIndex]

  // Handle parameter form submission
  const handleParameterSubmit = (values: Record<string, string>) => {
    if (parsedSpec && selectedOperation) {
      fetchOperation(parsedSpec.baseUrl, selectedOperation, values)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">api2ui</h1>
          <p className="text-lg text-gray-600">
            Paste an API URL, see it rendered
          </p>
        </div>

        {/* URL Input */}
        <div className="flex justify-center mb-8">
          <URLInput />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading && <SkeletonTable />}

          {error && !loading && (
            <ErrorDisplay error={error} onRetry={handleRetry} />
          )}

          {/* OpenAPI Spec UI */}
          {parsedSpec && !loading && !error && (
            <div className="space-y-6">
              {/* Spec Info Header */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">
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

              {/* Operation Selector + Parameter Form */}
              {parsedSpec.operations.length > 0 && selectedOperation && (
                <>
                  {parsedSpec.operations.length > 1 && (
                    <OperationSelector
                      operations={parsedSpec.operations}
                      selectedIndex={selectedOperationIndex}
                      onSelect={setSelectedOperation}
                    />
                  )}

                  {parsedSpec.operations.length === 1 && (
                    <OperationSelector
                      operations={parsedSpec.operations}
                      selectedIndex={0}
                      onSelect={() => {}}
                    />
                  )}

                  <ParameterForm
                    parameters={selectedOperation.parameters}
                    onSubmit={handleParameterSubmit}
                    loading={loading}
                  />
                </>
              )}

              {/* Data Rendering (after fetching operation) */}
              {schema && data !== null && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Data</h3>
                  <DynamicRenderer
                    data={data}
                    schema={schema.rootType}
                    path="$"
                    depth={0}
                  />
                </div>
              )}
            </div>
          )}

          {/* Direct API URL flow (existing behavior) */}
          {!parsedSpec && schema && data !== null && !loading && !error && (
            <>
              <DynamicRenderer
                data={data}
                schema={schema.rootType}
                path="$"
                depth={0}
              />
            </>
          )}

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
  )
}

export default App
