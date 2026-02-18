interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  pageNumbers: (number | '...')[]
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  itemsPerPageOptions?: number[]
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  pageNumbers,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
}: PaginationControlsProps) {
  const firstItem = (currentPage - 1) * itemsPerPage + 1
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <nav aria-label="Pagination Navigation" className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
      {/* Left — Status */}
      <div className="hidden sm:block text-sm text-muted-foreground">
        Showing {firstItem}-{lastItem} of {totalItems}
      </div>

      {/* Center — Page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="min-w-[36px] px-2 py-1 text-sm border border-border rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${idx}`} aria-hidden="true" className="px-2 text-muted-foreground">
                ...
              </span>
            )
          }

          const isActive = pageNum === currentPage
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-[36px] px-2 py-1 text-sm rounded ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-surface'
              }`}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="min-w-[36px] px-2 py-1 text-sm border border-border rounded hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Right — Items per page */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="items-per-page" className="text-muted-foreground">
          Per page:
        </label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-border rounded px-2 py-1 text-sm bg-background"
        >
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </nav>
  )
}
