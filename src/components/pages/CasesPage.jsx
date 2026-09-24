import { useEffect, useMemo, useState } from 'react'
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { AddCaseModal } from '../cases/AddCaseModal'
import { CaseDetailsModal } from '../cases/CaseDetailsModal'
import { caseStatusLabel, parseApiError } from '../../api/cases'
import { getStoredCompanyId } from '../../api/client'
import {
  useCaseCategories,
  useCaseMutations,
  useCases,
  useCaseTypes,
} from '../../hooks/useCases'
import { useClients } from '../../hooks/useClients'
import { useLawyers } from '../../hooks/useLawyers'

function statusClass(status) {
  if (status === 'closed' || status === 'منتهي') return 'status-pill status-pill--done'
  if (status === 'postponed' || status === 'مؤجل') return 'status-pill status-pill--hold'
  return 'status-pill status-pill--active'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

function resolveLawyerName(item, lawyerNameById) {
  const nested =
    item.lawyer?.user?.full_name ||
    item.lawyer?.full_name ||
    item.lawyer?.name ||
    item.lawyerName
  if (nested && nested !== '—') return nested
  if (item.lawyer_id != null) {
    const fromList = lawyerNameById.get(Number(item.lawyer_id))
    if (fromList && fromList !== '—') return fromList
  }
  return '—'
}

export default function CasesPage() {
  const { cases, isLoading, isFetching, error, refetch } = useCases()
  const { caseTypes } = useCaseTypes()
  const { caseCategories } = useCaseCategories()
  const { clients } = useClients()
  const { lawyers } = useLawyers()
  const { create, remove } = useCaseMutations()

  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const lawyerNameById = useMemo(() => {
    const map = new Map()
    for (const lawyer of lawyers) {
      if (lawyer?.id == null) continue
      map.set(Number(lawyer.id), lawyer.name)
    }
    return map
  }, [lawyers])

  const hasActiveFilters = Boolean(query.trim())

  const clearFilters = () => setQuery('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cases
    return cases.filter((item) =>
      [
        item.case_number,
        item.title,
        item.client?.full_name,
        resolveLawyerName(item, lawyerNameById),
        item.type?.name,
        item.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [cases, query, lawyerNameById])

  const handleSave = async (payload) => {
    const companyId = getStoredCompanyId()
    try {
      await create.mutateAsync({
        ...payload,
        ...(companyId != null ? { company_id: companyId } : {}),
      })
      showToast('تم إضافة القضية بنجاح')
      setAddOpen(false)
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
      throw err
    }
  }

  const handleUpdateCase = async () => {
    await refetch()
  }

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id)
      if (selectedCase?.id === id) setSelectedCase(null)
      showToast('تم حذف القضية بنجاح')
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const loading = isLoading
  const refreshing = isFetching && !isLoading

  return (
    <div className="cases-page">
      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">القضايا</h2>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={loading || refreshing}
            title="تحديث"
          >
            <HiOutlineRefresh
              size={18}
              className={refreshing ? 'animate-spin' : undefined}
              aria-hidden
            />
            تحديث
          </button>
          <div className="search-field">
            <Icon name="search" className="search-field__icon" />
            <input
              className="search-field__input"
              type="search"
              placeholder="بحث في القضايا..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في القضايا"
            />
          </div>
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setAddOpen(true)}
          >
            <Icon name="plus" size={18} />
            إضافة قضية
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.tone === 'success'
              ? 'mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'
          }
        >
          <p className="font-medium">{toast.text}</p>
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل القضايا...</p>
        </div>
      ) : null}

      {/* Error */}
      {!loading && error ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل البيانات</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => refetch()}
          >
            <HiOutlineRefresh size={18} aria-hidden />
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {/* Table */}
      {!loading && !error ? (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم القضية</th>
                  <th>العنوان</th>
                  <th>الموكل</th>
                  <th>المحامي</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>الجلسة القادمة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="data-table__empty">
                      {query.trim()
                        ? 'لا توجد قضايا مطابقة لبحثك'
                        : 'لا توجد قضايا مسجلة بعد'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="data-table__mono">{item.case_number}</td>
                      <td>{item.title}</td>
                      <td>{item.client?.full_name ?? '—'}</td>
                      <td>{resolveLawyerName(item, lawyerNameById)}</td>
                      <td>{item.type?.name ?? '—'}</td>
                      <td>
                        <span className={statusClass(item.status)}>
                          {caseStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>{formatDate(item.next_session_date)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn action-btn--view"
                            title="عرض"
                            aria-label={`عرض ${item.title}`}
                            onClick={() => setSelectedCase(item)}
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="تعديل"
                            aria-label={`تعديل ${item.title}`}
                            onClick={() => setSelectedCase(item)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="حذف"
                            aria-label={`حذف ${item.title}`}
                            onClick={() => handleDelete(item.id)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 ? (
            <div className="flex items-center justify-between border-t border-[#d5e0e0] px-4 py-3 text-xs text-[#6b7f80]">
              <span>
                عرض {filtered.length} من أصل {cases.length} قضية
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <AddCaseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
        caseTypes={caseTypes}
        caseCategories={caseCategories}
        clients={clients}
        lawyers={lawyers}
      />

      <CaseDetailsModal
        open={Boolean(selectedCase)}
        caseData={
          selectedCase
            ? {
                ...selectedCase,
                lawyerName: resolveLawyerName(selectedCase, lawyerNameById),
                lawyerDetails: {
                  ...selectedCase.lawyerDetails,
                  name: resolveLawyerName(selectedCase, lawyerNameById),
                },
              }
            : null
        }
        onClose={() => setSelectedCase(null)}
        onUpdate={handleUpdateCase}
        readOnly={false}
      />
    </div>
  )
}
