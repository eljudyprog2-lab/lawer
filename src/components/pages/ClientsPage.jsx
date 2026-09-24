import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { ClientFormModal } from '../clients/ClientFormModal'
import { ClientCasesModal } from '../clients/ClientCasesModal'
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  normalizeClient,
  buildClientPayload,
  validateClientForm,
  parseApiError,
} from '../../api/clients'
import { caseStatusLabel } from '../../api/cases'
import { getStoredCompanyId } from '../../api/client'
import { useCases } from '../../hooks/useCases'

function statusClass(status) {
  if (status === 'نشط') return 'status-pill status-pill--active'
  if (status === 'موقوف') return 'status-pill status-pill--done'
  return 'status-pill status-pill--hold'
}

export default function ClientsPage() {
  const navigate = useNavigate()
  const { cases: allCases } = useCases()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingClient, setEditingClient] = useState(null)
  const [casesClient, setCasesClient] = useState(null)
  const [saving, setSaving] = useState(false)

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const loadClients = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const list = await fetchClients()
      setClients(list.map(normalizeClient))
    } catch (err) {
      setError(parseApiError(err).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const casesByClientId = useMemo(() => {
    const map = new Map()
    for (const c of allCases) {
      const key = c.client_id
      if (key == null) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({
        id: c.id,
        number: c.case_number || c.number,
        title: c.title,
        status: caseStatusLabel(c.status),
      })
    }
    return map
  }, [allCases])

  const clientsWithCounts = useMemo(
    () =>
      clients.map((client) => ({
        ...client,
        casesCount: casesByClientId.get(client.id)?.length ?? 0,
      })),
    [clients, casesByClientId],
  )

  const hasActiveFilters = Boolean(query.trim())

  const clearFilters = () => setQuery('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientsWithCounts
    return clientsWithCounts.filter((item) =>
      [item.name, item.email, item.phone, item.national_id, item.status]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [clientsWithCounts, query])

  const openAdd = () => {
    setFormMode('add')
    setEditingClient(null)
    setFormOpen(true)
  }

  const openEdit = (client) => {
    setFormMode('edit')
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleSave = async (form) => {
    if (saving) return
    const validation = validateClientForm(form, { isUpdate: formMode === 'edit' })
    if (!validation.ok) {
      showToast(validation.message, 'error')
      return
    }

    const payload = buildClientPayload(form, { companyId: getStoredCompanyId() })
    setSaving(true)
    try {
      if (formMode === 'edit' && editingClient) {
        const updated = await updateClient(editingClient.id, payload)
        if (updated) {
          setClients((prev) =>
            prev.map((item) =>
              item.id === editingClient.id ? normalizeClient(updated) : item,
            ),
          )
        } else {
          await loadClients({ silent: true })
        }
        showToast('تم تحديث بيانات الموكل بنجاح')
      } else {
        const created = await createClient(payload)
        if (created) {
          setClients((prev) => [normalizeClient(created), ...prev])
        } else {
          await loadClients({ silent: true })
        }
        showToast('تم إضافة الموكل بنجاح')
      }
      setFormOpen(false)
      setEditingClient(null)
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموكل؟')) return
    try {
      await deleteClient(id)
      setClients((prev) => prev.filter((item) => item.id !== id))
      if (casesClient?.id === id) setCasesClient(null)
      showToast('تم حذف الموكل بنجاح')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  return (
    <div className="cases-page">
      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">الموكلون</h2>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => loadClients({ silent: true })}
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
              placeholder="بحث في الموكلين..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في الموكلين"
            />
          </div>
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Icon name="plus" size={18} />
            إضافة موكل
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
          <p className="text-sm font-medium">جاري تحميل بيانات الموكلين...</p>
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
            onClick={() => loadClients()}
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
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الهاتف</th>
                  <th>رقم الهوية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="data-table__empty">
                      {query.trim()
                        ? 'لا يوجد موكلون مطابقون لبحثك'
                        : 'لا يوجد موكلون مسجلون بعد'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.phone || '—'}</td>
                      <td>{item.national_id || '—'}</td>
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
                            onClick={() => navigate(`/clients/${item.id}`)}
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--notes"
                            title="قضايا الموكل"
                            aria-label={`قضايا ${item.name}`}
                            onClick={() => setCasesClient(item)}
                          >
                            <Icon name="cases" size={16} />
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
                عرض {filtered.length} من أصل {clients.length} موكل
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <ClientFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingClient}
        submitting={saving}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditingClient(null)
        }}
        onSave={handleSave}
      />

      <ClientCasesModal
        open={Boolean(casesClient)}
        client={casesClient}
        cases={casesByClientId.get(casesClient?.id) ?? []}
        onClose={() => setCasesClient(null)}
      />
    </div>
  )
}
