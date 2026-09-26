import { useMemo, useState } from 'react'

/**
 * usePagination — slices a filtered array into pages.
 *
 * Returns:
 *  { page, setPage, paginated, totalPages, resetPage }
 */
export function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / perPage))

  // Clamp page when filters change the total
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage
    return items.slice(start, start + perPage)
  }, [items, safePage, perPage])

  const resetPage = () => setPage(1)

  return {
    page: safePage,
    setPage,
    paginated,
    totalPages,
    resetPage,
  }
}
