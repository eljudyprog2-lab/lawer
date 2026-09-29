import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
} from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { useClient } from '../../hooks/useClients'
import { useCases } from '../../hooks/useCases'
import { useAppointments } from '../../hooks/useAppointments'
import { useInvoices } from '../../hooks/useInvoices'
import { caseStatusLabel } from '../../api/cases'
import { remaining, formatMoney } from '../../api/invoices'
import { formatDisplayDate } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name || name === '—') return 'م'
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

/**
 * Dedicated client profile page — matching ProfilePage design system.
 */
export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { client, isLoading, error, refetch } = useClient(id)
  const { cases } = useCases()
  const { appointments } = useAppointments()
  const { invoices } = useInvoices()

  const clientCases = cases.filter((c) => String(c.client_id) === String(id))
  const clientAppointments = appointments.filter(
    (a) => String(a.clientId) === String(id),
  )
  const clientInvoices = invoices.filter((inv) => String(inv.clientId) === String(id))
  const balance = clientInvoices.reduce((sum, inv) => sum + remaining(inv), 0)

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-panel-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <HiOutlineRefresh size={32} className="animate-spin text-gold" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
            جاري تحميل ملف وبيانات الموكل...
          </p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="profile-page">
        <div className="profile-panel-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <span
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(196, 69, 69, 0.1)',
              color: 'var(--danger, #c44545)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <HiOutlineExclamationCircle size={30} />
          </span>
          <h2 style={{ color: 'var(--brand-teal)', fontSize: '1.2rem', fontWeight: 800 }}>
            تعذر تحميل بيانات الموكل
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 1.5rem' }}>
            {error || 'الموكل غير موجود بالنظام'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="profile-action-btn profile-action-btn--primary" onClick={() => refetch()}>
              <HiOutlineRefresh size={18} />
              إعادة المحاولة
            </button>
            <Link to="/clients" className="profile-action-btn profile-action-btn--ghost">
              العودة لقائمة الموكلين
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isActive = client.status === 'نشط'

  return (
    <div className="profile-page">
      {/* ── شريط التنقل العلوي ── */}
      <div className="profile-topbar">
        <nav className="profile-breadcrumbs" aria-label="مسار التنقل">
          <Link to="/dashboard">لوحة التحكم</Link>
          <span>/</span>
          <Link to="/clients">الموكلين</Link>
          <span>/</span>
          <span className="current">{client.name}</span>
        </nav>

        <div className="profile-db-status">
          <span className="profile-db-status__dot" />
          <span>ملف الموكل متصل ومحدث بالنظام</span>
        </div>
      </div>

      {/* ── بطاقة رأس الملف (Hero Card) ── */}
      <section className="profile-hero">
        <div className="profile-hero__right">
          <div className="profile-hero__avatar-box">
            <span>{initials(client.name)}</span>
            <span className="profile-hero__avatar-badge" title="موكل معتمد">
              <HiOutlineCheck size={13} />
            </span>
          </div>

          <div className="profile-hero__info">
            <div className="profile-hero__title-row">
              <h1 className="profile-hero__name">{client.name}</h1>
              <span
                className="profile-hero__status-tag"
                style={{
                  background: isActive ? 'var(--success-bg, #e8f6ef)' : '#fef3c7',
                  color: isActive ? 'var(--success, #2d8a5e)' : '#b45309',
                  borderColor: isActive ? 'rgba(45, 138, 94, 0.2)' : 'rgba(180, 83, 9, 0.2)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isActive ? 'var(--success, #2d8a5e)' : '#b45309',
                  }}
                />
                {client.status || 'نشط'}
              </span>
              <span className="profile-hero__id-tag">ID: CL-{String(client.id).padStart(6, '0')}</span>
            </div>

            <p className="profile-hero__subtitle">
              {client.type ? `النوع: ${client.type}` : 'موكل معتمد'} •{' '}
              {client.phone ? `هاتف: ${client.phone}` : client.email || 'سجل رسمي'}
            </p>

            <div className="profile-hero__auth-row">
              <span className="profile-hero__nafath-pill">
                <HiOutlineShieldCheck size={16} />
                <span>ملف موكل مسجل ومعتمد بالنظام</span>
              </span>
              <span className="profile-hero__auth-timestamp">
                تاريخ التسجيل: {formatDisplayDate(client.registeredAt)}
              </span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="profile-hero__actions">
          <button
            type="button"
            className="profile-action-btn profile-action-btn--primary"
            onClick={() => refetch()}
          >
            <HiOutlineRefresh size={18} />
            <span>تحديث البيانات</span>
          </button>

          <button
            type="button"
            className="profile-action-btn profile-action-btn--ghost"
            onClick={() => navigate('/clients')}
          >
            <span>&larr; العودة للموكلين</span>
          </button>
        </div>
      </section>

      {/* ── شريط الإحصائيات (4 بطاقات) ── */}
      <section className="profile-stats-grid" aria-label="إحصائيات الموكل">
        <div className="profile-stat-card">
          <span className="profile-stat-card__title">إجمالي القضايا</span>
          <span className="profile-stat-card__number">{clientCases.length}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--teal">قضية نشطة</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">المواعيد والاستشارات</span>
          <span className="profile-stat-card__number">{clientAppointments.length}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--gold">موعد مجدول</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">الفواتير والمطالبات</span>
          <span className="profile-stat-card__number">{clientInvoices.length}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--slate">مطالبة مالية</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">الرصيد المتبقي</span>
          <span
            className="profile-stat-card__number"
            style={{ fontSize: '1.45rem', color: balance > 0 ? 'var(--brand-gold-dark, #9a7322)' : 'var(--success, #2d8a5e)' }}
          >
            {formatMoney(balance)}
          </span>
          <span className="profile-stat-card__badge profile-stat-card__badge--emerald">
            {balance > 0 ? 'مستحقات حالية' : 'خالص السداد'}
          </span>
        </div>
      </section>

      {/* ── محتوى الملف الرئيسي ── */}
      <div className="profile-content-grid">
        {/* البطاقة الأولى: المعلومات الشخصية والاتصال */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>المعلومات الشخصية والاتصال</span>
            </h2>
            <span className="profile-panel-card__badge-sub">
              آخر تحديث: {formatDisplayDate(client.updatedAt)}
            </span>
          </header>

          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="profile-field-item__label">الاسم الكامل (المعتمد)</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{client.name}</span>
                <span className="profile-field-item__badge profile-field-item__badge--slate">
                  ID: CL-{client.id}
                </span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الهوية الوطنية / السجل</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(client.nationalId)}</span>
                {client.nationalId ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">
                    سارية المفعول
                  </span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">البريد الإلكتروني المعتمد</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">
                  {display(client.email)}
                </span>
                {client.email ? (
                  <span className="profile-field-item__badge profile-field-item__badge--teal">
                    موثق
                  </span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الجوال المعتمد</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">
                  {display(client.phone)}
                </span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">نوع وصفة الموكل</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(client.type || 'فرد / موكل')}</span>
                <span className="profile-field-item__badge profile-field-item__badge--teal">
                  موكل نظامي
                </span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">معرف الشركة التابع لها</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">#{display(client.company_id)}</span>
              </div>
            </div>

            <div className="profile-field-item profile-field-item--full">
              <span className="profile-field-item__label">العنوان الوطني المعتمد للمراسلات</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineLocationMarker size={17} color="var(--brand-teal)" />
                <span className="profile-field-item__value">{display(client.address)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">تاريخ التسجيل بالنظام</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineCalendar size={16} color="var(--brand-gold-dark, #9a7322)" />
                <span className="profile-field-item__value">{formatDisplayDate(client.registeredAt)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">آخر تحديث للسجل</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineCalendar size={16} color="var(--text-muted)" />
                <span className="profile-field-item__value">{formatDisplayDate(client.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* البطاقة الثانية: الملاحظات (إن وجدت) */}
        {client.notes ? (
          <div className="profile-panel-card">
            <header className="profile-panel-card__head">
              <h2 className="profile-panel-card__title">
                <span className="profile-panel-card__bullet" />
                <span>الملاحظات والتوجيهات الخاصة بالموكل</span>
              </h2>
            </header>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                fontSize: '0.88rem',
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              {client.notes}
            </div>
          </div>
        ) : null}

        {/* البطاقة الثالثة: قضايا الموكل */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>قضايا الموكل المسجلة في النظام</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="profile-panel-card__badge-pill">
                إجمالي القضايا: {clientCases.length}
              </span>
              <Link to="/cases" className="btn btn--ghost" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                عرض كافة القضايا
              </Link>
            </div>
          </header>

          {clientCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Icon name="cases" size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا توجد قضايا مسجلة لهذا الموكل حالياً.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>رقم القضية</th>
                    <th style={{ width: '45%' }}>عنوان وملف القضية</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>الحالة الإجرائية</th>
                  </tr>
                </thead>
                <tbody>
                  {clientCases.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-teal)' }}>
                        {item.case_number || item.number || `#${item.id}`}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-h)' }}>
                        {item.title}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-pill status-pill--active">
                          {caseStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* البطاقة الرابعة: المواعيد والاستشارات */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>المواعيد والاستشارات القانونية</span>
            </h2>
            <span className="profile-panel-card__badge-pill">
              إجمالي المواعيد: {clientAppointments.length}
            </span>
          </header>

          {clientAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Icon name="calendar" size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا توجد مواعيد مسجلة لهذا الموكل حالياً.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {clientAppointments.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--brand-teal)' }}>
                      {item.type || 'موعد استشاري'}
                    </strong>
                    <span className="mgmt-badge" style={{ background: 'rgba(196, 163, 90, 0.16)', color: 'var(--brand-gold-dark, #9a7322)' }}>
                      {item.status || 'مجدول'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <HiOutlineCalendar size={15} />
                    <span>{formatDisplayDate(item.date)} {item.time || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* البطاقة الخامسة: الفواتير والمطالبات */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>الفواتير والمطالبات المالية</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="profile-panel-card__badge-pill">
                إجمالي الفواتير: {clientInvoices.length}
              </span>
              <Link to="/invoices" className="btn btn--ghost" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                إدارة الفواتير
              </Link>
            </div>
          </header>

          {clientInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Icon name="invoices" size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا توجد فواتير مرتبطة بهذا الموكل.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {clientInvoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--brand-teal)' }}>
                      {inv.number || `فاتورة #${inv.id}`}
                    </strong>
                    <span
                      className="mgmt-badge"
                      style={{
                        background: inv.status === 'مدفوعة' ? 'var(--success-bg, #e8f6ef)' : 'rgba(196, 163, 90, 0.16)',
                        color: inv.status === 'مدفوعة' ? 'var(--success, #2d8a5e)' : 'var(--brand-gold-dark, #9a7322)',
                      }}
                    >
                      {inv.status || 'معلقة'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>المبلغ الإجمالي:</span>
                    <strong style={{ color: 'var(--text-h)' }}>{formatMoney(inv.total)}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>المتبقي:</span>
                    <strong style={{ color: remaining(inv) > 0 ? 'var(--danger, #c44545)' : 'var(--success, #2d8a5e)' }}>
                      {formatMoney(remaining(inv))}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
