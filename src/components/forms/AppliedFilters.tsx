import { Badge } from '@/components/ui/badge'

interface AppliedFiltersProps {
  filters: Record<string, string>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function AppliedFilters({
  filters,
  onRemove,
  onClearAll,
}: AppliedFiltersProps) {
  // Filter out empty values
  const activeFilters = Object.entries(filters).filter(
    ([_, value]) => value !== '' && value !== undefined
  )

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-2 px-4 flex items-center gap-2 flex-wrap shadow-sm">
      <span className="text-sm font-medium text-gray-600 shrink-0">
        Filters:
      </span>

      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="gap-1 max-w-[200px]">
          <span className="truncate">
            {key}: {value}
          </span>
          <button
            type="button"
            onClick={() => onRemove(key)}
            className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5 shrink-0"
            aria-label={`Remove filter ${key}`}
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Badge>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto text-sm text-gray-500 hover:text-gray-700 hover:underline shrink-0"
      >
        Clear all
      </button>
    </div>
  )
}
