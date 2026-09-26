import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useLookupOverview } from '../../hooks/useLookups'

export default function ManageListsPage() {
  const {
    groups,
    totalRegisteredOptions,
    managedApiGroupsCount,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLookupOverview()

  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (text, tone = 'success') => {
    setToast({ text, tone })
    setTimeout(() => setToast(null), 3500)
  }

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Tab filter
      if (activeTab !== 'all' && group.category !== activeTab) {
        return false
      }
      // Text search
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const text = `${group.name} ${group.englishName} ${group.description} ${group.code}`.toLowerCase()
        return text.includes(q)
      }
      return true
    })
  }, [groups, activeTab, query])

  return (
    <div className="mgmt-page">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="mgmt-topbar">
        <div className="mgmt-topbar__title-wrap">
          <div className="mgmt-topbar__icon">
            <Icon name="tag" size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.2rem' }}>
              <span>إدارة النظام</span> &gt; <span>إدارة القوائم والخيارات (Manage Lists)</span>
            </div>
            <h1 className="mgmt-topbar__title">مجموعات الخيارات والقوائم المنسدلة</h1>
            <p className="mgmt-topbar__subtitle">
              تخصيص وإدارة القوائم المنسدلة وخيارات النظام الأساسية (أنواع القضايا، التصنيفات، الحالات الإجرائية، وأنواع المستندات)
            </p>
          </div>
        </div>

        <div className="mgmt-topbar__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              refetch()
              showToast('تم تحديث بيانات القوائم بنجاح')
            }}
            disabled={isFetching}
            title="تحديث البيانات"
          >
            <Icon name="refresh" size={16} className={isFetching ? 'animate-spin' : undefined} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* ── Toast notification ── */}
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

      {/* ── Summary Stats Grid (Top row from Stitch) ── */}
      <div className="mgmt-stats-grid">
        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">{groups.length}</div>
            <div className="mgmt-stat-card__label">إجمالي مجموعات القوائم</div>
            <div className="mgmt-stat-card__sub" style={{ color: '#0d9488' }}>
              موزعة عبر وحدات النظام
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--teal">
            <Icon name="tag" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">{totalRegisteredOptions}</div>
            <div className="mgmt-stat-card__label">إجمالي خيارات النظام</div>
            <div className="mgmt-stat-card__sub" style={{ color: '#2563eb' }}>
              خيارات مسجلة ونظامية
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--blue">
            <Icon name="cases" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">{managedApiGroupsCount}</div>
            <div className="mgmt-stat-card__label">قوائم مدعومة بالكامل (CRUD)</div>
            <div className="mgmt-stat-card__sub" style={{ color: '#d97706' }}>
              أنواع وتصنيفات القضايا
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--amber">
            <Icon name="shield" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val" style={{ fontSize: '1.25rem', marginTop: '0.35rem' }}>
              متطابقة ومستقرة
            </div>
            <div className="mgmt-stat-card__label">حالة الربط والـ API</div>
            <div className="mgmt-stat-card__sub" style={{ color: '#059669' }}>
              متصل بالواجهة الخلفية
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--green">
            <Icon name="check" size={22} />
          </div>
        </div>
      </div>

      {/* ── Table & Filter Card ── */}
      <div className="mgmt-table-card">
        {/* Filter tabs and search row */}
        <div className="mgmt-tabs-row">
          <div className="mgmt-tabs">
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              الكل ({groups.length})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'cases' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('cases')}
            >
              القضايا والمحاكم ({groups.filter((g) => g.category === 'cases').length})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'documents' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              المستندات والملفات ({groups.filter((g) => g.category === 'documents').length})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'finance' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              المالية والإدارية ({groups.filter((g) => g.category === 'finance').length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث في مجموعات الخيارات..."
              style={{
                width: '100%',
                height: '40px',
                padding: '0 2.25rem 0 0.85rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Groups table */}
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>اسم المجموعة وتوصيف الخيارات</th>
                <th style={{ width: '15%', textAlign: 'center' }}>عدد الخيارات الحالية</th>
                <th style={{ width: '15%' }}>آخر تحديث / المصدر</th>
                <th style={{ width: '15%' }}>الحالة بالنظام</th>
                <th style={{ width: '15%', textAlign: 'center' }}>الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Icon name="refresh" size={24} className="animate-spin" />
                      <span>جاري تحميل بيانات القوائم...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    لم يتم العثور على مجموعات مطابقة لبحثك
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.key}>
                    {/* Name & description */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#f1f5f9',
                            color: '#1e293b',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <Icon name={group.icon} size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                              {group.name} ({group.englishName})
                            </span>
                            <span className="mgmt-code-badge">{group.code}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                            {group.description}
                          </div>
                          {group.sampleItems && group.sampleItems.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                              {group.sampleItems.map((item, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.72rem',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    padding: '0.1rem 0.45rem',
                                    borderRadius: '6px',
                                    color: '#475569',
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Option Count */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          background: group.count > 0 ? '#eff6ff' : '#f1f5f9',
                          color: group.count > 0 ? '#1d4ed8' : '#64748b',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                        }}
                      >
                        {group.count} خيار
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {group.lastUpdated}
                      </span>
                    </td>

                    {/* System Status */}
                    <td>
                      {group.isManagedByApi ? (
                        <span
                          className="mgmt-badge"
                          style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                        >
                          <Icon name="check" size={12} />
                          قابلة للإدارة (API)
                        </span>
                      ) : (
                        <span
                          className="mgmt-badge"
                          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                          title="هذه القائمة محددة كثوابت نظامية في الكود وقاعدة البيانات"
                        >
                          ثوابت نظامية (Enums)
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'center' }}>
                      <Link
                        to={`/manage-lists/${group.key}`}
                        className="btn btn--primary"
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.82rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Icon name="edit" size={14} />
                        <span>إدارة الخيارات</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Regulatory / Compliance Advisory Banner ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '16px',
          padding: '1.15rem 1.35rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#fef3c7',
            color: '#b45309',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <Icon name="shield" size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400e', marginBottom: '0.25rem' }}>
            ضوابط القوائم النظامية والمعيارية
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6 }}>
            القوائم المصنفة كـ «قابلة للإدارة» ترتبط مباشرة بقاعدة بيانات النظام وتنعكس فوراً في نماذج العمل. أما القوائم النظامية (مثل حالات القضايا ومراحل الجلسات) فهي ثوابت بنيوية محددة وفق الأنظمة القضائية والمسار الإجرائي للمحاكم لضمان سلامة الأرشفة والتقارير.
          </p>
        </div>
      </div>
    </div>
  )
}
