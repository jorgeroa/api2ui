import { FEATURED_EXAMPLES } from '../data/examples'

interface ExamplesCarouselProps {
  onExampleClick: (url: string) => Promise<void>
  loading: boolean
  loadingUrl?: string | null
}

const typeDotColor: Record<string, string> = {
  Array: 'bg-green-500',
  Object: 'bg-gray-400',
  OpenAPI: 'bg-purple-500',
}

export function ExamplesCarousel({ onExampleClick, loading, loadingUrl }: ExamplesCarouselProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="relative">
        <div className="overflow-x-auto scroll-smooth pb-2 -mx-1 px-1" style={{ scrollSnapType: 'x proximity' }}>
          <div className="inline-flex gap-3">
            {FEATURED_EXAMPLES.map((example) => {
              const isLoading = loadingUrl === example.url && loading
              return (
                <button
                  key={example.url}
                  onClick={() => onExampleClick(example.url)}
                  disabled={loading}
                  className="relative flex-none w-[180px] p-3 border border-border rounded-lg text-left transition-all duration-150 hover:border-foreground/20 hover:shadow-sm hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed bg-card"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${typeDotColor[example.type] ?? 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-foreground truncate">{example.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{example.description}</p>

                  {isLoading && (
                    <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}

            {/* Explore more card */}
            <button
              onClick={() => {
                window.location.hash = '#/examples'
                window.dispatchEvent(new HashChangeEvent('hashchange'))
              }}
              className="flex-none w-[180px] p-3 border border-dashed border-border rounded-lg text-left transition-all duration-150 hover:border-foreground/20 hover:shadow-sm hover:-translate-y-px flex flex-col items-center justify-center gap-1"
              style={{ scrollSnapAlign: 'start' }}
            >
              <span className="text-sm font-medium text-muted-foreground">Explore more</span>
              <span className="text-xs text-muted-foreground/70">View full catalog</span>
            </button>
          </div>
        </div>
        {/* Right fade gradient - theme aware */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  )
}
