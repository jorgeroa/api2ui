import { useMemo } from 'react'

export interface UsePaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
}

export interface UsePaginationReturn {
  currentPage: number    // Clamped to valid range [1, totalPages]
  totalPages: number     // Math.ceil(totalItems / itemsPerPage)
  firstIndex: number     // (currentPage - 1) * itemsPerPage
  lastIndex: number      // Math.min(firstIndex + itemsPerPage, totalItems)
  hasNextPage: boolean
  hasPrevPage: boolean
  pageNumbers: (number | '...')[]  // Smart truncation array
}

export function usePagination({
  totalItems,
  itemsPerPage,
  currentPage,
}: UsePaginationProps): UsePaginationReturn {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Handle edge case where totalPages is 0 (empty data)
  if (totalPages === 0) {
    return {
      currentPage: 1,
      totalPages: 0,
      firstIndex: 0,
      lastIndex: 0,
      hasNextPage: false,
      hasPrevPage: false,
      pageNumbers: [],
    }
  }

  // Clamp currentPage to valid range [1, totalPages]
  const validPage = Math.max(1, Math.min(currentPage, totalPages))

  const firstIndex = (validPage - 1) * itemsPerPage
  const lastIndex = Math.min(firstIndex + itemsPerPage, totalItems)

  const hasNextPage = validPage < totalPages
  const hasPrevPage = validPage > 1

  // Smart page number truncation
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Show first page, last page, current +/- 1, with '...' ellipses where gaps exist
    const pages: (number | '...')[] = []

    // Always show first page
    pages.push(1)

    // Determine range around current page
    const showLeftEllipsis = validPage > 3
    const showRightEllipsis = validPage < totalPages - 2

    if (showLeftEllipsis) {
      pages.push('...')
    }

    // Show pages around current
    const start = Math.max(2, validPage - 1)
    const end = Math.min(totalPages - 1, validPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (showRightEllipsis) {
      pages.push('...')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }, [totalPages, validPage])

  return {
    currentPage: validPage,
    totalPages,
    firstIndex,
    lastIndex,
    hasNextPage,
    hasPrevPage,
    pageNumbers,
  }
}
