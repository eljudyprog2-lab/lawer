import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineCheck,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineScale,
} from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { useLawyer } from '../../hooks/useLawyers'
import { useCases } from '../../hooks/useCases'
import { useAppointments } from '../../hooks/useAppointments'
import { caseStatusLabel } from '../../api/cases'
import { formatDisplayDate } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name || name === '—') return 'م'
  return String(name)
    .replace(/^أ\.\s*|^د\.\s*/u, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

/**
 * Dedicated lawyer profile page — matching ProfilePage design system.
 */
export default function LawyerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lawyer, isLoading, error, refetch } = useLawyer(id)
  const { cases } = useCases()
  const { appointments } = useAppointments()

  const lawyerCases = cases.filter((c) => String(c.lawyer_id) === String(id))
  const lawyerAppointments = appointments.filter(
    (a) => String(a.lawyerId) === String(id),
  )

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-panel-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <HiOutlineRefresh size={32} className="animate-spin text-gold" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
            جاري تحميل ملف وبيانات المحامي...
          </p>
        </div>
      </div>
    )
  }

  if (error || !lawyer) {
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
            تعذر تحميل بيانات المحامي
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 1.5rem' }}>
            {error || 'المحامي غير موجود بالنظام'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="profile-action-btn profile-action-btn--primary" onClick={() => refetch()}>
              <HiOutlineRefresh size={18} />
              إعادة المحاولة
            </button>
            <Link to="/lawyers" className="profile-action-btn profile-action-btn--ghost">
              العودة لقائمة المحامين
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isActive = lawyer.status === 'نشط'

  return (
    <div className="profile-page">
      {/* ── شريط التنقل العلوي ── */}
      <div className="profile-topbar">
        <nav className="profile-breadcrumbs" aria-label="مسار التنقل">
          <Link to="/dashboard">لوحة التحكم</Link>
          <span>/</span>
          <Link to="/lawyers">المحامين</Link>
          <span>/</span>
          <span className="current">{lawyer.name}</span>
        </nav>

        <div className="profile-db-status">
          <span className="profile-db-status__dot" />
          <span>ملف المحامي متصل ومحدث بالنظام</span>
        </div>
      </div>

      {/* ── بطاقة رأس الملف (Hero Card) ── */}
      <section className="profile-hero">
        <div className="profile-hero__right">
          <div className="profile-hero__avatar-box">
            <span>{initials(lawyer.name)}</span>
            <span className="profile-hero__avatar-badge" title="محامي مرخص ومعتمد">
              <HiOutlineCheck size={13} />
            </span>
          </div>

          <div className="profile-hero__info">
            <div className="profile-hero__title-row">
              <h1 className="profile-hero__name">{lawyer.name}</h1>
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
                {lawyer.status || 'نشط'}
              </span>
              <span className="profile-hero__id-tag">ID: LW-{String(lawyer.id).padStart(6, '0')}</span>
            </div>

            <p className="profile-hero__subtitle">
              {lawyer.specialization ? `تخصص: ${lawyer.specialization}` : 'محامي ومستشار قانوني'} •{' '}
              {lawyer.barNumber ? `رخصة رقم: ${lawyer.barNumber}` : 'عضو مقيد بالنقابة'}
            </p>

            <div className="profile-hero__auth-row">
              <span className="profile-hero__nafath-pill">
                <HiOutlineShieldCheck size={16} />
                <span>محامي معتمد ومسجل رسمياً بالنظام</span>
              </span>
              <span className="profile-hero__auth-timestamp">
                تاريخ التسجيل: {formatDisplayDate(lawyer.registeredAt)}
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
            onClick={() => navigate('/lawyers')}
          >
            <span>&larr; العودة للمحامين</span>
          </button>
        </div>
      </section>

      {/* ── شريط الإحصائيات (4 بطاقات) ── */}
      <section className="profile-stats-grid" aria-label="إحصائيات المحامي">
        <div className="profile-stat-card">
          <span className="profile-stat-card__title">القضايا المشرف عليها</span>
          <span className="profile-stat-card__number">{lawyerCases.length}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--teal">قضية نشطة</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">المواعيد والاستشارات</span>
          <span className="profile-stat-card__number">{lawyerAppointments.length}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--gold">جلسة استشارة</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">التخصص المعتمد</span>
          <span
            className="profile-stat-card__number"
            style={{ fontSize: lawyer.specialization?.length > 12 ? '1.25rem' : '1.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={lawyer.specialization || 'قانون عام'}
          >
            {lawyer.specialization || 'قانون عام'}
          </span>
          <span className="profile-stat-card__badge profile-stat-card__badge--slate">مجال الترافع</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">حالة القيد والاعتماد</span>
          <span className="profile-stat-card__number" style={{ fontSize: '1.45rem' }}>
            {lawyer.status || 'نشط'}
          </span>
          <span className="profile-stat-card__badge profile-stat-card__badge--emerald">ترخيص سارٍ</span>
        </div>
      </section>

      {/* ── محتوى الملف الرئيسي ── */}
      <div className="profile-content-grid">
        {/* البطاقة الأولى: المعلومات الشخصية وبيانات القيد */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>المعلومات الشخصية والمهنية</span>
            </h2>
            <span className="profile-panel-card__badge-sub">
              آخر تحديث: {formatDisplayDate(lawyer.updatedAt)}
            </span>
          </header>

          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="profile-field-item__label">الاسم الكامل (المعتمد قضائياً)</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{lawyer.name}</span>
                <span className="profile-field-item__badge profile-field-item__badge--slate">
                  ID: LW-{lawyer.id}
                </span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الهوية الوطنية</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(lawyer.nationalId)}</span>
                {lawyer.nationalId ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">
                    سارية المفعول
                  </span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">البريد الإلكتروني</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">
                  {display(lawyer.email)}
                </span>
                {lawyer.email ? (
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
                  {display(lawyer.phone)}
                </span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم القيد بالنقابة</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(lawyer.barNumber)}</span>
                {lawyer.barNumber ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">
                    مرخص وممارس
                  </span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">التخصص القانوني الأساسي</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(lawyer.specialization)}</span>
              </div>
            </div>

            <div className="profile-field-item profile-field-item--full">
              <span className="profile-field-item__label">العنوان ومقر العمل المعتمد</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineLocationMarker size={17} color="var(--brand-teal)" />
                <span className="profile-field-item__value">{display(lawyer.address)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">معرف المستخدم بالنظام</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">#{display(lawyer.user_id)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">تاريخ التسجيل بالنظام</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineCalendar size={16} color="var(--brand-gold-dark, #9a7322)" />
                <span className="profile-field-item__value">{formatDisplayDate(lawyer.registeredAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* البطاقة الثانية: الملاحظات (إن وجدت) */}
        {lawyer.notes ? (
          <div className="profile-panel-card">
            <header className="profile-panel-card__head">
              <h2 className="profile-panel-card__title">
                <span className="profile-panel-card__bullet" />
                <span>الملاحظات المهنية والتوجيهات</span>
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
              {lawyer.notes}
            </div>
          </div>
        ) : null}

        {/* البطاقة الثالثة: قضايا المحامي */}
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <span className="profile-panel-card__bullet" />
              <span>القضايا المكلف بها المحامي</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="profile-panel-card__badge-pill">
                إجمالي القضايا: {lawyerCases.length}
              </span>
              <Link to="/cases" className="btn btn--ghost" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                عرض كافة القضايا
              </Link>
            </div>
          </header>

          {lawyerCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Icon name="cases" size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا توجد قضايا مكلف بها هذا المحامي حالياً.</p>
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
                  {lawyerCases.map((item) => (
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
              <span>المواعيد والاستشارات المجدولة</span>
            </h2>
            <span className="profile-panel-card__badge-pill">
              إجمالي المواعيد: {lawyerAppointments.length}
            </span>
          </header>

          {lawyerAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Icon name="calendar" size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا توجد مواعيد مجدولة مرتبطة بهذا المحامي.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {lawyerAppointments.map((item) => (
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
                      {item.clientName || item.type || 'موعد استشاري'}
                    </strong>
                    <span className="mgmt-badge" style={{ background: 'rgba(196, 163, 90, 0.16)', color: 'var(--brand-gold-dark, #9a7322)' }}>
                      {item.type || 'استشارة'}
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
      </div>
    </div>
  )
}
