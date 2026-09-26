import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pagination } from '../ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { useNavigate } from 'react-router-dom'
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { LawyerFormModal } from '../lawyers/LawyerFormModal'
import {
  fetchLawyers,
  createLawyer,
  updateLawyer,
  deleteLawyer,
  normalizeLawyer,
  buildLawyerPayload,
  validateLawyerForm,
  parseApiError,
} from '../../api/lawyers'
import { getStoredCompanyId } from '../../api/client'

function statusClass(status) {
  if (status === 'نشط') return 'status-pill status-pill--active'
  if (status === 'موقوف') return 'status-pill status-pill--done'
  return 'status-pill status-pill--hold'
}

export default function LawyersPage() {
  const navigate = useNavigate()
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingLawyer, setEditingLawyer] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingLawyer, setDeletingLawyer] = useState(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const loadLawyers = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const list = await fetchLawyers()
      setLawyers(list.map(normalizeLawyer))
    } catch (err) {
      setError(parseApiError(err).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadLawyers()
  }, [loadLawyers])

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const hasActiveFilters = Boolean(query.trim())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lawyers
    return lawyers.filter((item) =>
      [item.name, item.email, item.phone, item.specialization, item.bar_number, item.status]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [lawyers, query])

  const { page, setPage, paginated, resetPage } = usePagination(filtered)

  const clearFilters = () => { setQuery(''); resetPage() }

  const openAdd = () => {
    setFormMode('add')
    setEditingLawyer(null)
    setFormOpen(true)
  }

  const openEdit = (lawyer) => {
    setFormMode('edit')
    setEditingLawyer(lawyer)
    setFormOpen(true)
  }

  const handleSave = async (form) => {
    if (saving) return
    const validation = validateLawyerForm(form, { isUpdate: formMode === 'edit' })
    if (!validation.ok) {
      showToast(validation.message, 'error')
      const err = new Error(validation.message)
      err.fieldErrors = validation.fieldErrors
      throw err
    }

    const payload = buildLawyerPayload(form, {
      companyId: getStoredCompanyId(),
      userId: editingLawyer?.user_id,
    })
    setSaving(true)
    try {
      if (formMode === 'edit' && editingLawyer) {
        await updateLawyer(editingLawyer.id, {
          ...payload,
          user_id: editingLawyer.user_id,
        })
        showToast('تم تحديث بيانات المحامي بنجاح')
      } else {
        await createLawyer(payload)
        showToast('تم إضافة المحامي بنجاح')
      }
      setFormOpen(false)
      setEditingLawyer(null)
      await loadLawyers({ silent: true })
    } catch (err) {
      const parsed = parseApiError(err)
      showToast(parsed.message, 'error')
      const next = new Error(parsed.message)
      next.fieldErrors = parsed.fieldErrors
      throw next
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingLawyer) return
    setDeletingLoading(true)
    try {
      await deleteLawyer(deletingLawyer.id)
      setLawyers((prev) => prev.filter((item) => item.id !== deletingLawyer.id))
      showToast('تم حذف المحامي بنجاح')
      setDeletingLawyer(null)
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div className="cases-page">
      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">المحامين</h2>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => loadLawyers({ silent: true })}
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
              placeholder="بحث في المحامين..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في المحامين"
            />
          </div>
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Icon name="plus" size={18} />
            إضافة محامي
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
          <p className="text-sm font-medium">جاري تحميل بيانات المحامين...</p>
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
            onClick={() => loadLawyers()}
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
            <table className="data-table data-table--lawyers">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>التخصص</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="data-table__empty">
                      {query.trim()
                        ? 'لا يوجد محامون مطابقون لبحثك'
                        : 'لا يوجد محامون مسجلون بعد'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="lawyer-name-cell">
                          <span className="lawyer-name-cell__name">{item.name}</span>
                          <span className="lawyer-name-cell__spec">
                            {item.specialization || '—'}
                          </span>
                        </div>
                      </td>
                      <td>{item.email}</td>
                      <td><span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{item.phone || '—'}</span></td>
                      <td>{item.specialization || '—'}</td>
                      <td>
                        <span className={statusClass(item.status)}>{item.status}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn action-btn--view"
                            title="تفاصيل"
                            aria-label={`تفاصيل ${item.name}`}
                            onClick={() => navigate(`/lawyers/${item.id}`)}
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="تعديل"
                            aria-label={`تعديل ${item.name}`}
                            onClick={() => openEdit(item)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="حذف"
                            aria-label={`حذف ${item.name}`}
                            onClick={() => setDeletingLawyer(item)}
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
          <Pagination
            page={page}
            total={filtered.length}
            onChange={(p) => setPage(p)}
          />
        </div>
      ) : null}

      <LawyerFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingLawyer}
        submitting={saving}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditingLawyer(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingLawyer)}
        onClose={() => setDeletingLawyer(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف المحامي"
        message="هل أنت متأكد من رغبتك في حذف هذا المحامي نهائياً؟"
        itemName={deletingLawyer?.name || ''}
        itemDetails={
          deletingLawyer ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div><strong>البريد:</strong> {deletingLawyer.email || '—'}</div>
              <div><strong>رقم القيد:</strong> {deletingLawyer.barNumber || '—'}</div>
            </div>
          ) : null
        }
        warning="سيتم إزالة ملف المحامي من النظام، وتجريده من القضايا المسندة إليه."
        isLoading={deletingLoading}
      />
    </div>
  )
}
