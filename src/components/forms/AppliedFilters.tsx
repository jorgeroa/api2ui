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
        <span
          key={key}
          className="group inline-flex items-center gap-1 max-w-[240px] pl-3 pr-1.5 py-1.5 text-sm bg-slate-50 text-slate-700 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
        >
          <span className="text-slate-400 truncate">{key}</span>
          <span className="text-slate-600 font-medium truncate">{value}</span>
          <button
            type="button"
            onClick={() => onRemove(key)}
            className="ml-1 rounded-full p-1 shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label={`Remove filter ${key}`}
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
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
