import { useEffect, useMemo, useState } from 'react'
import {
  HiOutlineExclamationCircle,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
} from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { CompanyFormModal } from '../companies/CompanyFormModal'
import { CompanyDetailsModal } from '../companies/CompanyDetailsModal'
import { CompanyDeleteModal } from '../companies/CompanyDeleteModal'
import { SaaSMetricsCards } from '../companies/SaaSMetricsCards'
import { CompanyLogo, PlanBadge, StatusBadge } from '../companies/CompanyBadges'
import {
  computeTenantMetrics,
  formatDisplayDate,
  isExpiringSoon,
  planLabel,
  statusLabel,
} from '../../api/companies'
import { useCompanies } from '../../hooks/useCompanies'

/**
 * Super-Admin SaaS dashboard for multi-tenant law-firm (Company) management.
 */
export default function CompaniesPage() {
  const { companies, isLoading, isFetching, error, refetch } = useCompanies()
  const [query, setQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [editingCompany, setEditingCompany] = useState(null)
  const [detailsCompany, setDetailsCompany] = useState(null)
  const [deletingCompany, setDeletingCompany] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const metrics = useMemo(() => computeTenantMetrics(companies), [companies])

  const hasActiveFilters =
    Boolean(query.trim()) || planFilter !== 'all' || statusFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setPlanFilter('all')
    setStatusFilter('all')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return companies.filter((item) => {
      if (planFilter !== 'all' && item.subscription_plan !== planFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true
      return [
        item.name,
        item.email,
        item.phone,
        item.address,
        item.subscription_plan,
        planLabel(item.subscription_plan),
        item.status,
        statusLabel(item.status),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [companies, query, planFilter, statusFilter])

  const openAdd = () => {
    setFormMode('add')
    setEditingCompany(null)
    setFormOpen(true)
  }

  const openEdit = (company) => {
    setFormMode('edit')
    setEditingCompany(company)
    setFormOpen(true)
  }

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const handleFormSuccess = async (saved, mode) => {
    const name = saved?.name || editingCompany?.name || 'المكتب'
    showToast(
      mode === 'edit' ? `تم تحديث «${name}» بنجاح` : `تم إنشاء «${name}» بنجاح`,
    )
    await refetch()
  }

  const handleDeleted = async (company) => {
    if (detailsCompany?.id === company.id) setDetailsCompany(null)
    if (editingCompany?.id === company.id) setEditingCompany(null)
    showToast(`تم حذف «${company.name}» بنجاح`)
    await refetch()
  }

  return (
    <div className="cases-page">
      {/* Header */}
      <div className="cases-toolbar">
        <div>
          <h2 className="cases-toolbar__title">إدارة المكاتب المستأجرة</h2>
          <p className="mt-1 text-sm text-[#6b7f80]">
            إدارة شركات المحاماة واشتراكاتها على مستوى المنصة
          </p>
        </div>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            title="تحديث"
          >
            <HiOutlineRefresh
              size={18}
              className={isFetching ? 'animate-spin' : undefined}
              aria-hidden
            />
            تحديث
          </button>
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Icon name="plus" size={18} />
            إضافة مكتب
          </button>
        </div>
      </div>

      <SaaSMetricsCards metrics={metrics} loading={isLoading} />

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

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#d5e0e0] bg-white p-3 shadow-[0_8px_24px_rgba(30,58,60,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <div className="search-field w-full sm:max-w-xs">
          <Icon name="search" className="search-field__icon" />
          <input
            className="search-field__input"
            type="search"
            placeholder="بحث بالاسم، البريد، الهاتف..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في المكاتب"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={planFilter}
            onChange={setPlanFilter}
            aria-label="تصفية حسب الخطة"
            options={[
              { value: 'all', label: 'كل الخطط' },
              { value: 'trial', label: 'تجريبي' },
              { value: 'basic', label: 'أساسي' },
              { value: 'professional', label: 'احترافي' },
              { value: 'enterprise', label: 'مؤسسي' },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="تصفية حسب الحالة"
            options={[
              { value: 'all', label: 'كل الحالات' },
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'غير نشط' },
              { value: 'expired', label: 'منتهي' },
            ]}
          />
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل بيانات المستأجرين...</p>
        </div>
      ) : null}

      {/* Error */}
      {!isLoading && error ? (
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

      {/* Tenants table */}
      {!isLoading && !error ? (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table data-table--companies">
              <thead>
                <tr>
                  <th>المكتب</th>
                  <th>التواصل</th>
                  <th>الخطة</th>
                  <th>الاشتراك</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="data-table__empty">
                      <div className="flex flex-col items-center gap-2 py-6">
                        <HiOutlineOfficeBuilding size={28} className="text-[#b8c9c9]" aria-hidden />
                        <span>
                          {query.trim() || planFilter !== 'all' || statusFilter !== 'all'
                            ? 'لا توجد مكاتب مطابقة للفلاتر الحالية'
                            : 'لا توجد مكاتب مسجّلة بعد'}
                        </span>
                        {!query.trim() && planFilter === 'all' && statusFilter === 'all' ? (
                          <button type="button" className="btn btn--primary mt-2" onClick={openAdd}>
                            <Icon name="plus" size={16} />
                            إضافة أول مكتب
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <CompanyLogo company={item} />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-brand">{item.name}</div>
                            <div className="truncate text-xs text-[#6b7f80]">
                              {item.address || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-sm">
                          <a
                            href={`mailto:${item.email}`}
                            className="truncate text-brand hover:underline"
                            dir="ltr"
                          >
                            {item.email || '—'}
                          </a>
                          <span className="text-[#6b7f80]" dir="ltr">
                            {item.phone || '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <PlanBadge plan={item.subscription_plan} />
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-xs text-[#6b7f80]">
                          <span>من {formatDisplayDate(item.subscription_start)}</span>
                          <span>إلى {formatDisplayDate(item.subscription_end)}</span>
                          {isExpiringSoon(item) ? (
                            <span className="mt-0.5 font-bold text-amber-600">قارب على الانتهاء</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn action-btn--view"
                            title="تفاصيل"
                            aria-label={`تفاصيل ${item.name}`}
                            onClick={() => setDetailsCompany(item)}
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
                            onClick={() => setDeletingCompany(item)}
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
                عرض {filtered.length} من أصل {companies.length} مكتب
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <CompanyFormModal
        open={formOpen}
        mode={formMode}
        company={editingCompany}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <CompanyDetailsModal
        open={Boolean(detailsCompany)}
        company={detailsCompany}
        onClose={() => setDetailsCompany(null)}
        onEdit={openEdit}
      />

      <CompanyDeleteModal
        open={Boolean(deletingCompany)}
        company={deletingCompany}
        onClose={() => setDeletingCompany(null)}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
