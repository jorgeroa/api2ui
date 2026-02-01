import { useAppStore } from './store/appStore'
import { useAPIFetch } from './hooks/useAPIFetch'
import { URLInput } from './components/URLInput'
import { DynamicRenderer } from './components/DynamicRenderer'
import { ErrorDisplay } from './components/error/ErrorDisplay'
import { SkeletonTable } from './components/loading/SkeletonTable'
import 'react-loading-skeleton/dist/skeleton.css'

function App() {
  const { url, loading, error, data, schema } = useAppStore()
  const { fetchAndInfer } = useAPIFetch()

  const handleRetry = () => {
    if (url) {
      fetchAndInfer(url)
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

          {schema && data !== null && !loading && !error && (
            <>
              <DynamicRenderer
                data={data}
                schema={schema.rootType}
                path="$"
                depth={0}
              />
            </>
          )}

          {!loading && !error && !schema && (
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
