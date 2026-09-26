/**
 * Pagination component — matches the project's design system (gold active, teal hover).
 *
 * Props:
 *  - page: current 1-based page number
 *  - total: total number of items
 *  - perPage: items per page (default 10)
 *  - onChange(newPage): called when the user changes the page
 */
export function Pagination({ page, total, perPage = 10, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  // Build visible page numbers with ellipsis
  const pages = buildPages(page, totalPages)

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="pagination-bar">
      <span className="pagination-bar__info">
        {start}–{end} من {total}
      </span>

      <nav className="pagination-nav" aria-label="ترقيم الصفحات" dir="ltr">
        {/* Previous */}
        <button
          type="button"
          className="pg-btn pg-btn--nav"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="pg-btn pg-btn--dots">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pg-btn${p === page ? ' pg-btn--active' : ''}`}
              onClick={() => p !== page && onChange(p)}
              aria-label={`صفحة ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          className="pg-btn pg-btn--nav"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="الصفحة التالية"
        >
          ›
        </button>
      </nav>
    </div>
  )
}

/** Build the array of page numbers (or '...' gaps) to display. */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = []
  const delta = 1 // pages around current

  const rangeStart = Math.max(2, current - delta)
  const rangeEnd = Math.min(total - 1, current + delta)

  pages.push(1)
  if (rangeStart > 2) pages.push('...')
  for (let p = rangeStart; p <= rangeEnd; p++) pages.push(p)
  if (rangeEnd < total - 1) pages.push('...')
  pages.push(total)

  return pages
}
