import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { OptionModal } from '../lists/OptionModal'
import { DeleteOptionModal } from '../lists/DeleteOptionModal'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { useLookupGroup } from '../../hooks/useLookups'
import { parseApiError } from '../../api/client'
import { apiRules } from '../../validation/apiRules'
import { validateLookupName } from '../../validation/validators'

export default function ListDetailPage() {
  const { listKey } = useParams()
  const {
    group,
    options,
    isLoading,
    isFetching,
    error,
    refetch,
    checkReferences,
    createOption,
    updateOption,
    deleteOption,
  } = useLookupGroup(listKey)

  // Local UI state
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOption, setEditingOption] = useState(null)
  const [deletingOption, setDeletingOption] = useState(null)
  const [toast, setToast] = useState(null)

  // Quick Add sidebar form state
  const [quickName, setQuickName] = useState('')
  const [quickDesc, setQuickDesc] = useState('')
  const [quickError, setQuickError] = useState(null)
  const [quickTouched, setQuickTouched] = useState(false)

  const showToast = (text, tone = 'success') => {
    setToast({ text, tone })
    setTimeout(() => setToast(null), 3500)
  }

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const q = search.trim().toLowerCase()
    return options.filter((opt) =>
      `${opt.name || ''} ${opt.code || ''} ${opt.description || ''}`.toLowerCase().includes(q),
    )
  }, [options, search])

  // Handle Quick Add Submit
  const handleQuickAdd = async (e) => {
    e.preventDefault()
    setQuickTouched(true)
    const err = validateLookupName(quickName)
    if (err) {
      setQuickError(err)
      return
    }

    try {
      await createOption.mutateAsync({
        name: quickName.trim(),
        description: quickDesc.trim(),
      })
      setQuickName('')
      setQuickDesc('')
      setQuickError(null)
      setQuickTouched(false)
      showToast('تمت إضافة الخيار بنجاح إلى القائمة')
      await refetch()
    } catch (apiErr) {
      showToast(parseApiError(apiErr).message, 'error')
    }
  }

  // Handle Modal Save (Create or Update)
  const handleModalSave = async (payload) => {
    try {
      if (editingOption?.id) {
        await updateOption.mutateAsync({
          id: editingOption.id,
          values: payload,
        })
        showToast('تم تحديث الخيار بنجاح')
      } else {
        await createOption.mutateAsync(payload)
        showToast('تمت إضافة الخيار بنجاح')
      }
      setModalOpen(false)
      setEditingOption(null)
      await refetch()
    } catch (apiErr) {
      showToast(parseApiError(apiErr).message, 'error')
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async (id) => {
    try {
      await deleteOption.mutateAsync(id)
      showToast('تم حذف الخيار بنجاح')
      setDeletingOption(null)
      await refetch()
    } catch (apiErr) {
      showToast(parseApiError(apiErr).message, 'error')
    }
  }

  if (!group) {
    return (
      <div className="mgmt-page">
        <div className="mgmt-topbar">
          <Link to="/manage-lists" className="mgmt-btn mgmt-btn--outline">
            &larr; العودة إلى كافة القوائم
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
          <Icon name="alert" size={32} />
          <h2 style={{ color: '#0f172a', marginTop: '0.75rem' }}>المجموعة غير موجودة</h2>
          <p>لم يتم العثور على مجموعة القوائم المطلوبة.</p>
        </div>
      </div>
    )
  }

  const isApiManaged = group.isManagedByApi

  return (
    <div className="mgmt-page">
      {/* ── Breadcrumb & Navigation Bar ── */}
      <div className="mgmt-topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem' }}>
            <Link to="/manage-lists" style={{ color: '#2563eb', textDecoration: 'none' }}>
              إدارة القوائم المعرفة
            </Link>
            <span>&gt;</span>
            <span>{group.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="mgmt-topbar__title">
              إدارة خيارات: {group.name} ({group.englishName})
            </h1>
            <span className="mgmt-code-badge">{group.code}</span>
            {isApiManaged ? (
              <span className="mgmt-badge" style={{ background: '#ecfdf5', color: '#047857' }}>
                <Icon name="check" size={12} />
                قائمة تفاعلية (CRUD)
              </span>
            ) : (
              <span className="mgmt-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                ثوابت نظامية (Enums)
              </span>
            )}
          </div>
          <p className="mgmt-topbar__subtitle">{group.usageContext}</p>
        </div>

        <div className="mgmt-topbar__actions">
          <Link to="/manage-lists" className="btn btn--ghost">
            &larr; العودة إلى كافة القوائم
          </Link>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              refetch()
              showToast('تم تحديث الخيارات بنجاح')
            }}
            disabled={isFetching}
            title="تحديث الخيارات"
          >
            <Icon name="refresh" size={16} className={isFetching ? 'animate-spin' : undefined} />
            <span>تحديث</span>
          </button>
          {isApiManaged && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setEditingOption(null)
                setModalOpen(true)
              }}
            >
              <Icon name="plus" size={16} />
              <span>إضافة خيار جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Toast Alert ── */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.15rem',
            borderRadius: '12px',
            background: toast.tone === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toast.tone === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${toast.tone === 'error' ? '#fecaca' : '#a7f3d0'}`,
            fontSize: '0.88rem',
            fontWeight: 700,
          }}
        >
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
          <span>{toast.text}</span>
        </div>
      ) : null}

      {/* ── Error Banner ── */}
      {error ? (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontSize: '0.88rem',
            fontWeight: 700,
          }}
        >
          <Icon name="alert" size={20} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ── Read-only System Notice (if group is not managed by API) ── */}
      {!isApiManaged && (
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#e2e8f0',
              color: '#334155',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="info" size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
              قائمة نظامية ثابتة (System Enumeration)
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
              خيارات هذه المجموعة محددة بنيوياً في كود وقاعدة بيانات الخادم (Backend Enums) لحفظ اتساق منطق المحاكم. لا توجد نقاط نهاية (Endpoints) لإضافة أو حذف خيارات من الواجهة البرمجية لهذه المجموعة؛ التعديلات تتطلب تحديث مسار النظام البرمجي.
            </p>
          </div>
        </div>
      )}

      {/* ── Ordering & API Notice Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          fontSize: '0.82rem',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="info" size={16} style={{ color: '#2563eb' }} />
          <span>
            <strong>ترتيب الخيارات:</strong> يتم فرز الخيارات وفق معرّف التسجيل الزمني (ID) المدعوم من خادم الـ API.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mgmt-counter-pill">إجمالي البنود: {options.length}</span>
        </div>
      </div>

      {/* ── Main Content Split (Stitch layout: Quick Add side panel + Table) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isApiManaged ? '320px 1fr' : '1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Quick Add Form Panel (Only for API-managed groups) */}
        {isApiManaged && (
          <div className="mgmt-card" style={{ padding: '1.25rem' }}>
            <div className="mgmt-card__header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
              <div className="mgmt-card__title-row">
                <span className="mgmt-dot--amber" />
                <h3 className="mgmt-card__title" style={{ fontSize: '0.95rem' }}>إضافة خيار سريع</h3>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>مباشر للـ API</span>
            </div>

            <form onSubmit={handleQuickAdd} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="mgmt-input-wrap">
                <label htmlFor="quick-opt-name" style={{ fontSize: '0.8rem' }}>
                  اسم الخيار <strong style={{ color: '#dc2626' }}>*</strong>
                </label>
                <input
                  id="quick-opt-name"
                  type="text"
                  value={quickName}
                  onChange={(e) => {
                    const v = e.target.value
                    setQuickName(v)
                    if (quickTouched) setQuickError(validateLookupName(v))
                  }}
                  onBlur={() => {
                    setQuickTouched(true)
                    setQuickError(validateLookupName(quickName))
                  }}
                  placeholder={`مثال: ${group.itemLabel} جديد...`}
                  maxLength={apiRules.lookups.name.max}
                  style={{
                    height: '40px',
                    borderColor: quickError ? '#dc2626' : undefined,
                    background: quickError ? '#fef2f2' : undefined,
                  }}
                />
                {quickError && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                    {quickError}
                  </span>
                )}
              </div>

              <div className="mgmt-input-wrap">
                <label htmlFor="quick-opt-desc" style={{ fontSize: '0.8rem' }}>
                  الوصف القانوني الداخلي (اختياري)
                </label>
                <textarea
                  id="quick-opt-desc"
                  rows={2}
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="وصف مختصر لمساعدة المحامين..."
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* صندوق ملخص أخطاء التحقق */}
              <ValidationSummaryBox errors={quickError} />

              <button
                type="submit"
                className="btn btn--primary"
                disabled={createOption.isPending}
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
              >
                {createOption.isPending ? (
                  <>
                    <Icon name="refresh" size={16} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={16} />
                    حفظ وإدراج بالقائمة
                  </>
                )}
              </button>
            </form>

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.76rem',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>ملاحظة تنظيمية:</div>
              الخيارات المضافة حديثاً تصبح متاحة فوراً لكافة منسوبي المكتب في نماذج تسجيل القضايا الجديدة.
            </div>
          </div>
        )}

        {/* Options Table / List */}
        <div className="mgmt-table-card">
          <div className="mgmt-tabs-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                خيارات القائمة المسجلة
              </span>
              <span className="mgmt-counter-pill">{filteredOptions.length}</span>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              >
                <Icon name="search" size={16} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الخيارات..."
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 2.25rem 0 0.85rem',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th style={{ width: '8%', textAlign: 'center' }}>#</th>
                  <th style={{ width: '42%' }}>اسم الخيار / التوصيف</th>
                  <th style={{ width: '20%' }}>حالة الاستخدام والتسجيل</th>
                  <th style={{ width: '15%' }}>الحالة</th>
                  {isApiManaged && <th style={{ width: '15%', textAlign: 'center' }}>إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={isApiManaged ? 5 : 4} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                        <Icon name="refresh" size={24} className="animate-spin" />
                        <span>جاري تحميل خيارات القائمة...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOptions.length === 0 ? (
                  <tr>
                    <td colSpan={isApiManaged ? 5 : 4} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', color: '#64748b' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#f8fafc',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#94a3b8',
                          }}
                        >
                          <Icon name="alert" size={24} />
                        </div>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>
                          لا توجد خيارات مضافة بعد في هذه المجموعة
                        </span>
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>
                          أضف الخيار الأول لتفعيله في النماذج للمحامين.
                        </p>
                        {isApiManaged && (
                          <button
                            type="button"
                            className="mgmt-btn mgmt-btn--dark"
                            onClick={() => {
                              setEditingOption(null)
                              setModalOpen(true)
                            }}
                            style={{ marginTop: '0.5rem' }}
                          >
                            <Icon name="plus" size={16} />
                            إضافة أول خيار
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const refInfo = checkReferences(opt.id)
                    return (
                      <tr key={opt.id || opt.code || idx}>
                        {/* Index / ID */}
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', color: '#64748b', fontWeight: 700 }}>
                          #{opt.id || idx + 1}
                        </td>

                        {/* Name & description */}
                        <td>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                              {opt.name}
                            </span>
                            {opt.description && (
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Reference / Usage Badge */}
                        <td>
                          {refInfo.isReferenced ? (
                            <span
                              className="mgmt-pill-badge"
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                            >
                              <Icon name="cases" size={13} />
                              مستخدم في {refInfo.count} قضية
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {opt.created_at ? new Date(opt.created_at).toLocaleDateString('ar-SA') : 'ثابت بالنظام'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className="mgmt-status-dot mgmt-status-dot--active">
                            نشط
                          </span>
                        </td>

                        {/* Actions (Only for API-managed items) */}
                        {isApiManaged && (
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                              <button
                                type="button"
                                className="action-btn action-btn--edit"
                                onClick={() => {
                                  setEditingOption(opt)
                                  setModalOpen(true)
                                }}
                                title="تعديل هذا الخيار"
                              >
                                <Icon name="edit" size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                onClick={() => setDeletingOption(opt)}
                                title="حذف هذا الخيار"
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Option Modal ── */}
      <OptionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingOption(null)
        }}
        onSubmit={handleModalSave}
        initialValues={editingOption}
        groupTitle={group.name}
        isLoading={createOption.isPending || updateOption.isPending}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteOptionModal
        open={Boolean(deletingOption)}
        onClose={() => setDeletingOption(null)}
        onConfirm={handleDeleteConfirm}
        option={deletingOption}
        groupTitle={group.name}
        referenceInfo={deletingOption ? checkReferences(deletingOption.id) : { isReferenced: false, count: 0, cases: [] }}
        isLoading={deleteOption.isPending}
      />
    </div>
  )
}
